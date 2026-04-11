export interface Tool {
  to: string
  label: string
  icon: string
  description: string
}

export interface ToolCategory {
  key: string
  label: string
  icon: string
  tools: Tool[]
}

export const useToolsNav = () => {
  const categories: ToolCategory[] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: 'IconScissors',
      tools: [
        { to: '/tools/trim', label: 'GIF Trim', icon: 'IconScissors', description: 'Cut and shorten GIFs by removing frames' },
        { to: '/tools/resize', label: 'GIF Resize', icon: 'IconResize', description: 'Change GIF dimensions with crop, pad, or stretch' },
        { to: '/tools/crop', label: 'GIF Crop', icon: 'IconCrop', description: 'Crop a specific region from animated GIFs' },
        { to: '/tools/rotate', label: 'GIF Rotate', icon: 'IconRotate', description: 'Rotate or flip animated GIFs' },
        { to: '/tools/add-text-to-gif', label: 'Add Text to GIF', icon: 'IconText', description: 'Add text, captions, and meme text to animated GIFs' },
      ],
    },
    {
      key: 'effects',
      label: 'Effects',
      icon: 'IconGauge',
      tools: [
        { to: '/tools/speed', label: 'GIF Speed', icon: 'IconGauge', description: 'Speed up or slow down GIF animation' },
        { to: '/tools/reverse', label: 'GIF Reverse', icon: 'IconReverse', description: 'Play GIFs backwards or create boomerang loops' },
        { to: '/tools/loop', label: 'GIF Loop', icon: 'IconLoop', description: 'Change how many times a GIF loops before stopping' },
      ],
    },
    {
      key: 'convert',
      label: 'Convert',
      icon: 'IconFrame',
      tools: [
        { to: '/tools/gif-to-png', label: 'GIF to PNG', icon: 'IconFrame', description: 'Extract individual frames as PNG images' },
        { to: '/tools/gif-to-mp4', label: 'GIF to MP4', icon: 'IconVideo', description: 'Convert GIFs to MP4 video for smaller file size' },
        { to: '/tools/video-to-gif', label: 'Video to GIF', icon: 'IconVideo', description: 'Convert video clips to animated GIFs' },
        { to: '/tools/gif-maker', label: 'GIF Maker', icon: 'IconFrame', description: 'Combine images into an animated GIF' },
      ],
    },
    {
      key: 'optimize',
      label: 'Optimize',
      icon: 'IconCompress',
      tools: [
        { to: '/tools/compress', label: 'GIF Compress', icon: 'IconCompress', description: 'Reduce GIF file size while preserving quality' },
      ],
    },
  ]

  // Only return categories that have at least one tool
  const activeCategories = computed(() => categories.filter(c => c.tools.length > 0))

  // Flat list for search or all-tools page
  const allTools = computed(() => categories.flatMap(c => c.tools.map(t => ({ ...t, category: c.label }))))

  return {
    categories,
    activeCategories,
    allTools,
  }
}
