const express = require('express')
const app = express()
const DEV_TOOL_PORT = 2329
let fs = require('fs')
let slugify = require('slugify')
let socket = require('socket.io')
let Http = require('http')
// app.use(express.json({ limit: '1GB' })) // for parsing application/json
let cors = require('cors')
let formidable = require('formidable').formidable
let http = Http.Server(app)
let io = new socket.Server(http, {
  cors: {
    credentials: true,
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
  },
})

app.use(cors({}))

app.use(
  express.raw({
    limit: '4GB',
  }),
)

/*
{
    "fields": {},
    "files": {
        "file": [
            {
                "size": 51663,
                "filepath": "/var/folders/mj/v4rx5_m50g53bxnyqwd07fl00000gn/T/ea9c4ee1418ef972a79b3a800",
                "newFilename": "ea9c4ee1418ef972a79b3a800",
                "mimetype": "image/png",
                "mtime": "2023-09-08T23:31:02.424Z",
                "originalFilename": "image.png"
            }
        ]
    }
}
*/

app.post('/file', async (req, res) => {
  //
  const form = formidable({})
  let fields
  let files
  try {
    ;[fields, files] = await form.parse(req)
  } catch (err) {
    // example to check for a very specific error
    if (err.code === formidableErrors.maxFieldsExceeded) {
    }
    console.error(err)
    res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' })
    res.end(String(err))
    return
  }

  let metas = []
  let proms = files.file.map(async (file) => {
    let name = `${file.originalFilename}`

    await fs.promises
      .mkdir(`./public/discover`, {
        recursive: true,
        replacement: '_',
      })
      .catch(console.error)

    let res = await fs.promises.readdir(`./public/discover/`)
    let count = (res.length + '').padStart(6, '0')
    let data = await fs.promises.readFile(file.filepath)
    let userInputTitle =
      slugify(fields.title[0], {
        strict: true,
      }) || 'untitled'

    let metadata = JSON.stringify(
      {
        uuid: `_${Math.random().toFixed(36).slice(2, 9)}_${Math.random().toFixed(36).slice(2, 9)}`,
        title: userInputTitle,
        createdAt: new Date(),
        ts: new Date().getTime(),
        name: name,
        mimetype: file.mimetype,
        size: file.size,
        origin: fields.origin[0],
        pathname: fields.pathname[0],
        thumbURL: `/discover/${count}__${userInputTitle}/${name}`,
      },
      null,
      '\t',
    )
    await fs.promises
      .mkdir(`./public/discover/${count}__${userInputTitle}`, {
        recursive: true,
      })
      .catch(console.error)
    await fs.promises.writeFile(`./public/discover/${count}__${userInputTitle}/${name}`, data)
    await fs.promises.writeFile(`./public/discover/${count}__${userInputTitle}/meta.json`, metadata)

    metas.push(JSON.parse(metadata))
  })

  await Promise.all(proms)

  res.json(metas)

  // let data = req.body

  // console.log(data)

  // res.json({ ok: true })
})

http.listen(DEV_TOOL_PORT, () => {
  console.log(`[DEV_TOOL_PORT] server running at http://localhost:${DEV_TOOL_PORT}/`)
})
// await fs.promises
//   .mkdir(`./public/blender-livelink-dropzone/${dateStr}/${name}__TS__${ts}`, {
//     recursive: true,
//   })
//   .catch(console.error)
