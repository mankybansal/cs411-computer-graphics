varying vec3 N;
varying vec3 V;
varying vec3 E;

varying vec3 B;
varying vec3 T;

uniform sampler2D textureUnit;
uniform sampler2D normalTextureUnit;
uniform vec4 TexColor;

#define MAX_LIGHTS 1

void main()
{
    // Construct Tangent Space Basis
    mat3 TBN = mat3 (T, B, N);

    vec3 normal = normalize (texture2D().xyz*2.0 - 1.0);

    vec4 color = vec4(0,0,0,0);
    for(int i = 0; i < MAX_LIGHTS; i++){
        vec4 lightPos = gl_LightSource[i].position;
        vec3 L = lightPos.w > 0 ? lightPos.xyz - V : lightPos;

        L *= TBN; // Transform into tangent-space

        float dist = length(L);
        L = normalize(L);

        float NdotL = max(dot(L,N),0.0);
        if(NdotL > 0)
        {
            float att = 1.0;
            if(lightPos.w > 0)
            {
                att = 1.0/ (gl_LightSource[i].constantAttenuation +
                gl_LightSource[i].linearAttenuation * dist +
                gl_LightSource[i].quadraticAttenuation * dist * dist);
            }

            vec4 diffuse =  clamp(att*NdotL*gl_FrontLightProduct[i].diffuse,0,1);
            color += att*gl_FrontLightProduct[i].ambient + diffuse;
        }
    }

    vec4 textureColor = texture2D(textureUnit, vec2(gl_TexCoord[0]));
    gl_FragColor = TexColor*textureColor + gl_FrontLightModelProduct.sceneColor + color;
}