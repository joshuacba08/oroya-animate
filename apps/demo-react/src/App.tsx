import { Scene, Node, createBox, Material } from '@oroya/core';
import { OroyaCanvas } from './OroyaCanvas';
import { useMemo } from 'react';

const containerStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  backgroundColor: '#111',
  color: 'white',
  fontFamily: 'sans-serif'
};

const titleStyles: React.CSSProperties = {
  position: 'absolute',
  top: '20px',
  left: '20px',
  zIndex: 10,
};

function App() {
  // Create the scene only once
  const scene = useMemo(() => {
    const scene = new Scene();
    const boxNode = new Node('rotating-box-react');
    boxNode.addComponent(createBox(1.5, 1.5, 1.5));
    boxNode.addComponent(new Material({ color: { r: 0.8, g: 0.1, b: 0.4 } }));
    scene.add(boxNode);
    return scene;
  }, []);

  return (
    <div style={containerStyles}>
      <h1 style={titleStyles}>Oroya Animate - React Demo</h1>
      <OroyaCanvas scene={scene} />
    </div>
  )
}

export default App
