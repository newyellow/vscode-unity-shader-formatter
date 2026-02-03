Shader "NY/SwarmParticles"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        uColor ("Color", Vector) = (1, 1, 1)
        uParticleScale ("Particle Scale", Float) = 1.0
    }
    SubShader
    {
        Tags { "RenderType" = "Opaque" }
        LOD 100

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            // make fog work
            #pragma multi_compile_fog

            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct Particle {
                float3 position;
                float3 positionOrg;
                float3 velocity;
                float3 color;
                float3 random;
                float scale;
                float speed;
                float life;
                float lifeDecay;
                int index;
                int isFollowing;
            };

            StructuredBuffer<Particle> bufferParticles;

            struct v2f
            {
                float2 uv : TEXCOORD0;
                float4 vertex : SV_POSITION;
                float3 color : COLOR;
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;
            float4x4 uTransformMatrix;
            float uParticleScale;
            float3 uColor;

            v2f vert(appdata v, uint instanceID : SV_InstanceID)
            {
                v2f o;
                Particle p = bufferParticles[instanceID];

                // Billboard calculation
                float3 worldPos = p.position;
                float3 cameraRight = normalize(UNITY_MATRIX_IT_MV[0].xyz);
                float3 cameraUp = normalize(UNITY_MATRIX_IT_MV[1].xyz);

                // Scale the quad
                float3 localPos = v.vertex.xyz * uParticleScale * p.scale * 0.005;

                // Apply billboard orientation
                float3 worldVertex =
                worldPos + 
                cameraRight * localPos.x + 
                cameraUp * localPos.y;

                o.vertex = UnityWorldToClipPos(float4(worldVertex, 1.0));
                o.uv = v.uv;
                o.color = p.color;
                return o;
            }

            fixed4 frag(v2f i) : SV_Target
            {
                // Optional : make particles circular
                float2 centeredUV = i.uv * 2 - 1;
                float distFromCenter = length(centeredUV);
                if(distFromCenter > 1) discard;

                // Optional : add soft edge
                float softness = smoothstep(1.0, 0.8, distFromCenter);
                return float4(i.color, softness);
            }
            ENDCG
        }
    }
}
