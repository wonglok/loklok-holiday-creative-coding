precision highp float;

uniform float time;
uniform float delta;
uniform float u_mixerProgress;
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

#define M_PI_3_1415 3.1415926535897932384626433832795

float atan2(in float y, in float x) {
  bool xgty = (abs(x) > abs(y));
  return mix(M_PI_3_1415 / 2.0 - atan(x,y), atan(y,x), float(xgty));
}

vec3 fromBall(float r, float az, float el) {
  return vec3(
    r * cos(el) * cos(az),
    r * cos(el) * sin(az),
    r * sin(el)
  );
}
void toBall(vec3 pos, out float az, out float el) {
  az = atan2(pos.y, pos.x);
  el = atan2(pos.z, sqrt(pos.x * pos.x + pos.y * pos.y));
}

// float az = 0.0;
// float el = 0.0;
// vec3 noiser = vec3(lastVel);
// toBall(noiser, az, el);
// lastVel.xyz = fromBall(1.0, az, el);

vec3 ballify (vec3 pos, float r) {
  float az = atan2(pos.y, pos.x);
  float el = atan2(pos.z, sqrt(pos.x * pos.x + pos.y * pos.y));
  return vec3(
    r * cos(el) * cos(az),
    r * cos(el) * sin(az),
    r * sin(el)
  );
}

mat4 rotationX( in float angle ) {
  return mat4(	1.0,		0,			0,			0,
          0, 	cos(angle),	-sin(angle),		0,
          0, 	sin(angle),	 cos(angle),		0,
          0, 			0,			  0, 		1);
}

mat4 rotationY( in float angle ) {
  return mat4(	cos(angle),		0,		sin(angle),	0,
              0,		1.0,			 0,	0,
          -sin(angle),	0,		cos(angle),	0,
              0, 		0,				0,	1);
}

mat4 rotationZ( in float angle ) {
  return mat4(	cos(angle),		-sin(angle),	0,	0,
          sin(angle),		cos(angle),		0,	0,
              0,				0,		1,	0,
              0,				0,		0,	1);
}

mat4 rotationMatrix (vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}

// thank you JESUS amen
// https://www.youtube.com/shorts/T-6gTCs-AfU

void main (void) {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec4 o_pos = texture2D(texturePosition, uv);
  vec4 o_move = texture2D(textureMove, uv);

  vec3 velocity = vec3(o_pos.rgb - o_move.rgb) / -25.0;
  vec3 xyz = normalize(velocity);
  float force = (length(xyz.x) + length(xyz.y) + length(xyz.z)) / 3.0;
  
  o_move.a += rand(uv + time) * 0.08;

  gl_FragColor = vec4(o_move.rgb + velocity, o_move.a);  
  
  if (o_pos.a >= 1.0 || force <= 0.3333) {
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
    
    gl_FragColor = vec4(transformed, 0.0);
  }
}