import React, { useEffect, useState } from 'react'
import './Entry.scss'
import logo from '../../../assets/logo.webp'
import title from '../../../assets/title.webp'

interface EntryProps {
  onImagesLoaded?: () => void;
}

const Entry: React.FC<EntryProps> = ({ onImagesLoaded }) => {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [titleLoaded, setTitleLoaded] = useState(false);

  useEffect(() => {
    if (logoLoaded && titleLoaded && onImagesLoaded) {
      onImagesLoaded();
    }
  }, [logoLoaded, titleLoaded, onImagesLoaded]);

  return (
    <div className='entry-container'>
      <img 
        className='entry-logo' 
        src={logo} 
        alt="logo" 
        onLoad={() => setLogoLoaded(true)}
      />
      <img 
        className='entry-title' 
        src={title} 
        alt="title" 
        onLoad={() => setTitleLoaded(true)}
      />
    </div>
  )
}

export default Entry
