export interface Project {
  id: string;
  category: 'web' | 'mobile';
  link: string;
  img: string;
  tags: string[];
}

export const PROJECTS: Project[] = [
  { id: 'p13', category: 'web',    link: 'project_13.html', img: './img/my_portfolio/CNC.webp',                    tags: ['Web Dev', 'React', 'WebGL'] },
  { id: 'p1',  category: 'web',    link: 'project_01.html', img: './img/my_portfolio/video_analyzation.webp',      tags: ['Web Dev', 'Figma', 'React'] },
  { id: 'p2',  category: 'mobile', link: 'project_02.html', img: './img/my_portfolio/video_analyzation_app.webp',  tags: ['UI/UX', 'Figma'] },
  { id: 'p3',  category: 'web',    link: 'project_03.html', img: './img/my_portfolio/police.webp',                 tags: ['Web Dev', 'Figma', 'React'] },
  { id: 'p4',  category: 'mobile', link: 'project_04.html', img: './img/my_portfolio/Tainan Police.webp',          tags: ['UI/UX', 'Figma'] },
  { id: 'p5',  category: 'web',    link: 'project_05.html', img: './img/my_portfolio/zoo.webp',                    tags: ['Web Dev', 'Adobe XD', 'Vue'] },
  { id: 'p6',  category: 'mobile', link: 'project_06.html', img: './img/my_portfolio/Taoyuan_MRT.webp',            tags: ['UI/UX', 'Adobe XD'] },
  { id: 'p7',  category: 'web',    link: 'project_07.html', img: './img/my_portfolio/dam.webp',                    tags: ['Web Dev', 'HTML/CSS'] },
  { id: 'p8',  category: 'mobile', link: 'project_08.html', img: './img/my_portfolio/stream.webp',                 tags: ['UI/UX', 'Adobe XD'] },
  { id: 'p9',  category: 'web',    link: 'project_09.html', img: './img/my_portfolio/enviroment.webp',             tags: ['Web Dev', 'HTML/CSS'] },
  { id: 'p10', category: 'web',    link: 'project_10.html', img: './img/my_portfolio/aviation.webp',               tags: ['UI/UX', 'Adobe XD'] },
  { id: 'p11', category: 'web',    link: 'project_11.html', img: './img/my_portfolio/student.webp',                tags: ['Web Dev', 'HTML/CSS'] },
  { id: 'p12', category: 'web',    link: 'project_12.html', img: './img/my_portfolio/coin.webp',                   tags: ['UI/UX', 'Adobe XD'] },
];
