'use client'
import { useEffect, useRef } from 'react'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

export default function RubiksCube() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current

    let THREE: any
    let animationId: number

    const init = async () => {
      THREE = await import('three')
      
      const width = mount.clientWidth
      const height = mount.clientHeight

      // Scene
      const scene = new THREE.Scene()

      // Camera
      const camera = new THREE.PerspectiveCamera(
        42, width / height, 0.1, 100
      )
      // Increased size by 20% by moving camera closer
      camera.position.set(4.7, 4.0, 6.8)
      camera.lookAt(0, 0, 0)

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 0)
      mount.appendChild(renderer.domElement)

      // LIGHTS
      const ambient = new THREE.AmbientLight(0xffffff, 2)
      scene.add(ambient)

      const purpleKey = new THREE.PointLight(0x9333ea, 80, 50)
      purpleKey.position.set(8, 8, 8)
      scene.add(purpleKey)

      const cyanFill = new THREE.PointLight(0x22d3ee, 50, 50)
      cyanFill.position.set(-8, -6, -6)
      scene.add(cyanFill)

      const whiteRim = new THREE.PointLight(0xffffff, 40, 50)
      whiteRim.position.set(-4, 8, 4)
      scene.add(whiteRim)

      const frontFill = new THREE.PointLight(0xffffff, 20, 50)
      frontFill.position.set(0, 0, 12)
      scene.add(frontFill)

      // BUILD 3x3x3 CUBE
      const cubeGroup = new THREE.Group()
      const SIZE = 0.92
      const GAP = 0.1
      const STEP = SIZE + GAP

      const purpleSet = new Set(['1,1,1', '0,1,1', '1,0,1'])
      const cyanSet = new Set(['-1,-1,1', '-1,-1,0'])

      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          for (let z = -1; z <= 1; z++) {
            const key = `${x},${y},${z}`
            let color = 0x1c1c2e
            let emissive = 0x000000
            let emissiveIntensity = 0
            let roughness = 0.1
            
            if (purpleSet.has(key)) {
              color = 0x7c3aed
              emissive = 0x4c1d95
              emissiveIntensity = 0.8
              roughness = 0.15
            } else if (cyanSet.has(key)) {
              color = 0x0891b2
              emissive = 0x164e63
              emissiveIntensity = 0.6
              roughness = 0.2
            }

            const geo = new RoundedBoxGeometry(SIZE, SIZE, SIZE, 4, 0.1)
            const mat = new THREE.MeshStandardMaterial({
              color: new THREE.Color(color),
              metalness: 0.95,
              roughness,
              emissive: new THREE.Color(emissive),
              emissiveIntensity,
            })

            const mesh = new THREE.Mesh(geo, mat)
            mesh.position.set(x * STEP, y * STEP, z * STEP)
            cubeGroup.add(mesh)
          }
        }
      }

      scene.add(cubeGroup)

      cubeGroup.rotation.x = 0.35
      cubeGroup.rotation.y = 0.55

      // Interaction State
      let isDragging = false
      let previousMousePosition = { x: 0, y: 0 }
      let targetRotX = cubeGroup.rotation.x
      let targetRotY = cubeGroup.rotation.y

      const onMouseDown = (e: MouseEvent) => {
        isDragging = true
        previousMousePosition = { x: e.clientX, y: e.clientY }
      }

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) {
          // Hover tracking (subtle)
          const rect = mount.getBoundingClientRect()
          const nx = (e.clientX - rect.left) / rect.width
          const ny = (e.clientY - rect.top) / rect.height
          if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
            targetRotY = (nx - 0.5) * 0.5 + cubeGroup.rotation.y
            targetRotX = -(ny - 0.5) * 0.3 + cubeGroup.rotation.x
          }
          return
        }

        const deltaMove = {
          x: e.clientX - previousMousePosition.x,
          y: e.clientY - previousMousePosition.y
        }

        cubeGroup.rotation.y += deltaMove.x * 0.01
        cubeGroup.rotation.x += deltaMove.y * 0.01
        
        targetRotX = cubeGroup.rotation.x
        targetRotY = cubeGroup.rotation.y

        previousMousePosition = { x: e.clientX, y: e.clientY }
      }

      const onMouseUp = () => {
        isDragging = false
      }

      mount.addEventListener('mousedown', onMouseDown)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)

      // Animation
      let time = 0
      const animate = () => {
        animationId = requestAnimationFrame(animate)
        time += 0.008

        if (!isDragging) {
          cubeGroup.rotation.y += 0.004
          cubeGroup.rotation.x += 0.001
        }

        purpleKey.position.x = Math.sin(time * 0.8) * 9
        purpleKey.position.y = Math.cos(time * 0.5) * 7
        cyanFill.position.x = Math.cos(time * 0.4) * 8
        cyanFill.position.z = Math.sin(time * 0.6) * 7

        renderer.render(scene, camera)
      }

      animate()

      const onResize = () => {
        const w = mount.clientWidth
        const h = mount.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
      window.addEventListener('resize', onResize)

      return () => {
        cancelAnimationFrame(animationId)
        mount.removeEventListener('mousedown', onMouseDown)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        window.removeEventListener('resize', onResize)
        renderer.dispose()
        if (mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement)
        }
      }
    }

    let cleanup: (() => void) | undefined
    init().then(fn => { cleanup = fn })
    return () => { cleanup?.() }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        cursor: 'grab',
      }}
    />
  )
}
