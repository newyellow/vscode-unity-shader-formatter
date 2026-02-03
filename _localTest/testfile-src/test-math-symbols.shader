// Each #kernel tells which function to compile; you can have many kernels
#pragma kernel CSMain

int uFrame;
int uNumParticles;
int uNumSeg;

RWStructuredBuffer < Particle > bufferParticle;
RWStructuredBuffer < Particle > bufferAllParticle;

[numthreads(128, 1, 1)]
void CSMain (uint3 id : SV_DispatchThreadID)
  {
    Particle p = bufferAllParticle[id.x];

    // one line
    if(a  = = b) { p. position    = bufferParticle [  particleIndex] . position; } 

    // math stuff
    int testAA    = 0;
    int testBB  = 2;
    testAA =  -testBB;
    testAA +   =  -   3  ;

    if(332    <  testAA)
    testBB *  =    2    ;

    if(    345 >   =  testBB)
    testAA /  =    2    ;

    if(  3333    <   =  testAA)
    testBB %  =    2    ;

    int particleIndex = floor(id.x / uNumSeg);
    int frameIndex = id.x % uNumSeg;

    if(1)
    testAA- =100  ;

    if(uFrame = = frameIndex) {
      p.position = bufferParticle[particleIndex].position;
      p.random.x = 1.0;
      } else {
        p.random.x = 0.0;
      }

      bufferAllParticle[id.x] = p;
    }
