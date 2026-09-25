export const COLORS = {
  sky: '#8fc0e8',
  // облака, от тени снизу к блику сверху-слева: тени холоднее и сиреневее, блик — чистый белый
  cloudTones: ['#a9b5d3', '#c1cee4', '#dbe5f2', '#f0f5fb', '#ffffff'] as const,
  bullet: '#26262b',
  smoke: '#5d6573',
  text: '#1c2733',
  textShadow: '#10141c',
  overlay: 'rgba(16, 20, 28, 0.6)',
  overlayText: '#f0f4fa',
};

export const PLAYER_COLORS: [{ body: string }, { body: string }] = [
  { body: '#d14b4b' },
  { body: '#3b6fd1' },
];
