let { NodeIO } = require('@gltf-transform/core')
let { prune, dedup, resample, textureResize, instance, textureCompress } = require('@gltf-transform/functions')

let sharp = require('sharp')
// let formidable = require("formidable");
let extensions = require('@gltf-transform/extensions')
const express = require('express')
const app = express()
const BLENDER_PORT = 8520
let moment = require('moment')
let md5 = require('md5')
let draco3d = require('draco3dgltf')
let fs = require('fs')
// app.use(express.json({ limit: "1GB" })); // for parsing application/json

app.use(
  express.raw({
    limit: '4GB',
  }),
)

app.post('/file', async (req, res) => {
  let data = req.body

  let name = req.headers['filename'] || ''

  optimiseGLB({ data, name: name })
    .then((glb) => {
      res.json({ ok: true })
      console.log('[FILE_PROCESSED]')
    })
    .catch((r) => {
      console.log(r)
      console.log('[ERROR]')
    })
})

async function optimiseGLB({ data, name }) {
  try {
    const io = new NodeIO()

    io.registerExtensions(extensions.ALL_EXTENSIONS)
    io.registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(), // Optional.
      'draco3d.encoder': await draco3d.createEncoderModule(), // Optional.
    })

    //

    let document
    document = await io.readBinary(data) // Uint8Array → Document

    // await io.write("model.glb", document); // → void

    await document.transform(
      // Remove duplicate vertex or texture data, if any.
      dedup(),

      instance(),

      // Losslessly resample animation frames.
      resample(),

      // Remove unused nodes, textures, or other data.
      prune(),

      // Resize all textures to ≤1K.
      // textureResize({ size: [1024, 1024] }),
      textureCompress({
        resize: [1024, 1024],
        quality: 100,
        lossless: true,
        encoder: sharp,
        // targetFormat: 'webp',
        // slots: /^(?!normalTexture).*$/, // exclude normal maps
      }),

      textureCompress({
        resize: [1024, 1024],
        quality: 100,
        lossless: true,
        encoder: sharp,
        targetFormat: 'webp',
        slots: /^(?!normalTexture).*$/, // exclude normal maps
      }),
    )

    document
      .createExtension(extensions.KHRDracoMeshCompression)
      .setRequired(true)
      .setEncoderOptions({
        method: extensions.KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER,
        quantizationBits: {
          mesh: 4,
        },
        encodeSpeed: 5,
        decodeSpeed: 5,
      })

    const glb = await io.writeBinary(document) // Document → Uint8Array

    let dateStr = moment().format('YYYY-MM-DD')
    let ts = new Date().getTime()

    await fs.promises
      .mkdir(`./public/blender-livelink-dropzone/${dateStr}/${name}__TS__${ts}`, {
        recursive: true,
      })
      .catch(console.error)

    await io.write(`./public/blender-livelink-dropzone/${dateStr}/${name}__TS__${ts}/${name}.glb`, document)

    return glb
  } catch (e) {
    console.log(e)
  }
}

app.listen(BLENDER_PORT, () => {
  console.log(`[BLENDER_PORT] http://localhost:${BLENDER_PORT}`)
})
