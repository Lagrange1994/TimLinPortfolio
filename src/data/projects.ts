export interface Project {
  id: string;
  category: 'web' | 'mobile';
  link: string;
  img: string;
  /** Mean color of the thumbnail — the lazy-load skeleton fill (see .project-card::before). Recompute if the image changes. */
  color: string;
  /** Mean color of the hover hero image (hero_img_preview.webp) — the expanded grid card's overlay tint once the ripple reveals it. Recompute if that image changes. */
  heroColor: string;
  tags: string[];
}

export const PROJECTS: Project[] = [
  { id: 'p13', category: 'web',    link: 'project_13.html', img: './img/my_portfolio/CNC.webp',                    color: '#253c4f', heroColor: '#4e524e', tags: ['Web Dev', 'React', 'WebGL'] },
  { id: 'p1',  category: 'web',    link: 'project_01.html', img: './img/my_portfolio/video_analyzation.webp',      color: '#a5d0d9', heroColor: '#192428', tags: ['Web Dev', 'Figma', 'React'] },
  { id: 'p2',  category: 'mobile', link: 'project_02.html', img: './img/my_portfolio/video_analyzation_app.webp',  color: '#e2e0dc', heroColor: '#675246', tags: ['UI/UX', 'Figma'] },
  { id: 'p3',  category: 'web',    link: 'project_03.html', img: './img/my_portfolio/police.webp',                 color: '#5b7688', heroColor: '#596268', tags: ['Web Dev', 'Figma', 'React'] },
  { id: 'p4',  category: 'mobile', link: 'project_04.html', img: './img/my_portfolio/Tainan Police.webp',          color: '#8be1d6', heroColor: '#5f4126', tags: ['UI/UX', 'Figma'] },
  { id: 'p5',  category: 'web',    link: 'project_05.html', img: './img/my_portfolio/zoo.webp',                    color: '#f0e7d7', heroColor: '#c9c6c3', tags: ['Web Dev', 'Adobe XD', 'Vue'] },
  { id: 'p6',  category: 'mobile', link: 'project_06.html', img: './img/my_portfolio/Taoyuan_MRT.webp',            color: '#b8a4cf', heroColor: '#9c9396', tags: ['UI/UX', 'Adobe XD'] },
  { id: 'p7',  category: 'web',    link: 'project_07.html', img: './img/my_portfolio/dam.webp',                    color: '#e5e8e9', heroColor: '#a59f96', tags: ['Web Dev', 'HTML/CSS'] },
  { id: 'p8',  category: 'mobile', link: 'project_08.html', img: './img/my_portfolio/stream.webp',                 color: '#9fbfc1', heroColor: '#1f170e', tags: ['UI/UX', 'Adobe XD'] },
  { id: 'p9',  category: 'web',    link: 'project_09.html', img: './img/my_portfolio/enviroment.webp',             color: '#c8d297', heroColor: '#919781', tags: ['Web Dev', 'HTML/CSS'] },
  { id: 'p10', category: 'web',    link: 'project_10.html', img: './img/my_portfolio/aviation.webp',               color: '#81b3d6', heroColor: '#78898b', tags: ['UI/UX', 'Adobe XD'] },
  { id: 'p11', category: 'web',    link: 'project_11.html', img: './img/my_portfolio/student.webp',                color: '#e8e8ea', heroColor: '#cac9c8', tags: ['Web Dev', 'HTML/CSS'] },
  { id: 'p12', category: 'web',    link: 'project_12.html', img: './img/my_portfolio/coin.webp',                   color: '#e4e3cd', heroColor: '#a4855d', tags: ['UI/UX', 'Adobe XD'] },
];
