import * as THREE from 'three'
import React, { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrthographicCamera, Html, Stats } from "@react-three/drei"
import { Selection, Select, EffectComposer, Outline } from '@react-three/postprocessing'
import create from 'zustand'
import Island from './models/Island'

const PI = Math.PI

const ViewMode = {
  Center: "Center",
  RightSide: "RightSide"
}

const useStore = create((set) => ({
  // define states
  viewMode: ViewMode.Center,

  // define state-mutating functions
  toggleViewMode: () => set((state) => ({
    viewMode: state.viewMode == ViewMode.Center ? ViewMode.RightSide : ViewMode.Center
  }))
}))

// function Rig() {
//   const [vec] = useState(() => new THREE.Vector3())
//   const { camera, mouse } = useThree()
//   useFrame(() => camera.position.lerp(vec.set(Math.sin(mouse.x) * 100, mouse.y * 25, Math.cos(mouse.x) * 100 + 200), 0.05))
//   return <CameraShake maxYaw={0.1} maxPitch={0.1} maxRoll={0.1} yawFrequency={0.5} pitchFrequency={0.5} rollFrequency={0.4} />
// }


const ViewSettings = {
  [ViewMode.RightSide]: {
    theta: 0.42*PI,
    phi: 0.5*PI,
    zoom: 28,
    posX: 15,
    posY: 0,
    posZ: 10
  },
  [ViewMode.Center]: {
    theta: 0.38*PI,
    phi: 0.5*PI,
    zoom: 55,
    posX: 0,
    posY: -1.5,
    posZ: 0
  }
}

function Sphere(props) {
  const ref = useRef()
  const [hovered, setHovered] = useState(false)
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
  }, [hovered])
  // useFrame((state) => (ref.current.position.x = Math.sin(state.clock.getElapsedTime())))

  const toggleViewMode = useStore(state => state.toggleViewMode)
  return (
    <Select enabled={hovered}>
      <mesh ref={ref} {...props} 
        onPointerOver={() => setHovered(true)} 
        onPointerOut={() => setHovered(false)}
        onClick={() => toggleViewMode()} >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="orange" />

        <Html
          style={{
            transition: 'all 0.2s',
            opacity: hovered ? 1 : 0,
            transform: `scale(${hovered ? 1 : 0})`
          }}
          position={[0, 1.5, 0]}
          transform>
          <span>Home Feed</span>
        </Html>
      </mesh>
    </Select>
  )
}

const DynamicOrthoCamera = (props) => {
  const ref = useRef()

  // default values
  const r = 20
  const theta = ViewSettings[ViewMode.Center].theta
  const phi = ViewSettings[ViewMode.Center].phi
  const zoom = ViewSettings[ViewMode.Center].zoom

  useFrame((state) => {
    ref.current.zoom = THREE.MathUtils.lerp(ref.current.zoom, ViewSettings[props.viewMode].zoom, 0.03)
    ref.current.theta = THREE.MathUtils.lerp(ref.current.theta, ViewSettings[props.viewMode].theta, 0.05)

    ref.current.position.x = r * Math.sin(ref.current.theta) * Math.cos(ref.current.phi)
    ref.current.position.y = r * Math.cos(ref.current.theta)
    ref.current.position.z = r * Math.sin(ref.current.theta) * Math.sin(ref.current.phi)

    var a = 4 / (zoom*zoom / 784)
    ref.current.lookTargetX = THREE.MathUtils.lerp(ref.current.lookTargetX, state.mouse.x * a, 0.05)
    ref.current.lookTargetZ = THREE.MathUtils.lerp(ref.current.lookTargetZ, state.mouse.y * a, 0.05)
    
    ref.current.lookAt(ref.current.lookTargetX, 0, ref.current.lookTargetZ)
    ref.current.updateProjectionMatrix()
  })

  return <OrthographicCamera
    makeDefault
    position = {[r * Math.sin(theta) * Math.cos(phi), r * Math.cos(theta), r * Math.sin(theta) * Math.sin(phi)]}
    far={200}
    near={0.01}
    theta={theta}
    phi={phi}
    zoom={zoom}
    lookTargetX={0}
    lookTargetZ={0}
    ref={ref}
  />
}

const DynamicScene = (props) => {
  const islandRef = useRef()
  const islandPosX = ViewSettings[ViewMode.Center].posX
  const islandPosY = ViewSettings[ViewMode.Center].posY
  const islandPosZ = ViewSettings[ViewMode.Center].posZ

  useFrame((state) => {
    islandRef.current.position.x = THREE.MathUtils.lerp(islandRef.current.position.x, ViewSettings[props.viewMode].posX, 0.05)
    islandRef.current.position.y = THREE.MathUtils.lerp(islandRef.current.position.y, ViewSettings[props.viewMode].posY, 0.05)
    islandRef.current.position.z = THREE.MathUtils.lerp(islandRef.current.position.z, ViewSettings[props.viewMode].posZ, 0.05)
  })

  return <group ref={islandRef} position={[islandPosX, islandPosY, islandPosZ]} >
    <Island />
    <Selection>
      <EffectComposer multisampling={8} autoClear={false}>
        <Outline blur visibleEdgeColor="#CDF0E4" edgeStrength={3} width={600} />
      </EffectComposer>
      <Sphere position={[4, 1, 0]}/>
    </Selection>
    </group>
}

export default function App() {
  const container = useRef()
  const viewMode = useStore(state => state.viewMode)
  // const [viewMode, setViewMode] = useState(ViewMode.Center)
  
  // useEffect(() => {
  //   const onPointerUp = (e) => {
  //   }
  //   const onPointerDown = () => {}
  //   const onPointerMove = () => {}
  
  //   container.current.addEventListener('pointerup', onPointerUp)
  //   container.current.addEventListener('pointerdown', onPointerDown)
  //   container.current.addEventListener('pointermove', onPointerMove)
  
  //   return () => {
  //     container.current.removeEventListener('pointerup', onPointerUp)
  //     container.current.removeEventListener('pointerdown', onPointerDown)
  //     container.current.removeEventListener('pointermove', onPointerMove)
  //   }
  // }, [viewMode])

  return (
    <div ref={container} className='root'>
      <Canvas gl={{ alpha: false }} >
        <color attach="background" args={['#d0d0d0']} />
        <fog attach="fog" args={['#d0d0d0', 10, 60]} />
        <ambientLight intensity={0.5} />
        <Suspense fallback={null}>
          <DynamicScene viewMode={viewMode} />
        </Suspense>
        <DynamicOrthoCamera 
          viewMode={viewMode}
        />
        <Stats />
      </Canvas>
    </div>
  )
}

