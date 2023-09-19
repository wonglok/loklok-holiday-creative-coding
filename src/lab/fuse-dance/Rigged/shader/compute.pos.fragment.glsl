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

void main (void) {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec4 o_pos = texture2D(texturePosition, uv);
  vec4 o_move = texture2D(textureMove, uv);
  vec3 velocity = vec3(o_pos.rgb - o_move.rgb) / -25.0;

  gl_FragColor = vec4(o_pos.rgb + velocity, o_move.a);
}