precision highp float;

uniform float time;
uniform float delta;
#include <common>

uniform sampler2D o_position;
// uniform sampler2D o_normal;
// uniform sampler2D o_uv;
uniform sampler2D o_skinIndex;
uniform sampler2D o_skinWeight;

uniform mat4 o_bindMatrix;
uniform mat4 o_bindMatrixInverse;
uniform mat4 o_o3dMatrix;
uniform mat4 o_parentMatrix;
uniform sampler2D o_boneTexture;
uniform sampler2D o_layout;
uniform vec2 u_resolution;

uniform int o_boneTextureSize;

mat4 getBoneMatrix( const in float i ) {
  float j = i * 4.0;
  float x = mod( j, float( o_boneTextureSize ) );
  float y = floor( j / float( o_boneTextureSize ) );
  float dx = 1.0 / float( o_boneTextureSize );
  float dy = 1.0 / float( o_boneTextureSize );
  y = dy * ( y + 0.5 );
  vec4 v1 = texture2D( o_boneTexture, vec2( dx * ( x + 0.5 ), y ) );
  vec4 v2 = texture2D( o_boneTexture, vec2( dx * ( x + 1.5 ), y ) );
  vec4 v3 = texture2D( o_boneTexture, vec2( dx * ( x + 2.5 ), y ) );
  vec4 v4 = texture2D( o_boneTexture, vec2( dx * ( x + 3.5 ), y ) );
  mat4 bone = mat4( v1, v2, v3, v4 );
  return bone;
}

void main (void) {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec4 o_pos = texture2D(texturePosition, uv);
  vec4 o_move = texture2D(textureMove, uv);

  vec3 position = o_pos.xyz;
  vec3 velocity = vec3(0.0);
  float phase = o_pos.a;

  // velocity += vec3(o_pos.rgb - o_move.rgb) / 60.0;

  // vec4 data_o_layout = texture2D( o_layout, uv );
  vec4 data_o_position = texture2D( o_position, uv );

  vec4 data_o_skinIndex = texture2D( o_skinIndex, uv );
  vec4 data_o_skinWeight = texture2D( o_skinWeight, uv );

  vec3 transformed = data_o_position.xyz;
  // vec3 objectNormal =  vec3(0.0);
  // vec3 objectTangent =  data_o_normal.xyz;

  mat4 boneMatX = getBoneMatrix( data_o_skinIndex.x );
  mat4 boneMatY = getBoneMatrix( data_o_skinIndex.y );
  mat4 boneMatZ = getBoneMatrix( data_o_skinIndex.z );
  mat4 boneMatW = getBoneMatrix( data_o_skinIndex.w );

  vec4 skinVertex = o_bindMatrix * vec4( transformed, 1.0 );
  vec4 skinned = vec4(0.0);
  skinned += boneMatX * skinVertex * data_o_skinWeight.x;
  skinned += boneMatY * skinVertex * data_o_skinWeight.y;
  skinned += boneMatZ * skinVertex * data_o_skinWeight.z;
  skinned += boneMatW * skinVertex * data_o_skinWeight.w;
  transformed = vec4( o_bindMatrixInverse * skinned ).xyz;

  transformed = vec3(o_o3dMatrix * vec4(transformed.rgb, 1.0));
  transformed = vec3(o_parentMatrix * vec4(transformed.rgb, 1.0));

  velocity.xyz = vec3(o_pos.rgb - transformed) * 1.0 / 20.0;

  if (phase >= 1.0 || o_move.a >= 1.0 || length(o_pos.rgb) == 0.0) {
    gl_FragColor = vec4(transformed, 0.0);
  } else {
    phase += rand(uv + time) * 0.08;
    gl_FragColor = vec4(position + velocity, phase);
  }
  
}