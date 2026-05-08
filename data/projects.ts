export interface Project {
  id: string;
  category: 'web' | 'mobile';
  link: string;
  img: string;
  titleKey: string;
  descKey: string;
  tags: string[];
}

export const PROJECTS: Project[] = [
  { id: 'p13', category: 'web',    link: '/project_13.html', img: '/img/my_portfolio/CNC.webp',                      titleKey: 'p13_title', descKey: 'p13_desc', tags: ['Web Dev', 'React', 'WebGL'] },
  { id: 'p1',  category: 'web',    link: '/project_01.html', img: '/img/my_portfolio/video_analyzation.webp',        titleKey: 'p1_title',  descKey: 'p1_desc',  tags: ['Web Dev', 'Figma', 'React'] },
  { id: 'p2',  category: 'mobile', link: '/project_02.html', img: '/img/my_portfolio/video_analyzation_app.webp',    titleKey: 'p2_title',  descKey: 'p2_desc',  tags: ['UI/UX', 'Figma'] },
  { id: 'p3',  category: 'web',    link: '/project_03.html', img: '/img/my_portfolio/police.webp',                   titleKey: 'p3_title',  descKey: 'p3_desc',  tags: ['Web Dev', 'Figma', 'React'] },
  { id: 'p4',  category: 'mobile', link: '/project_04.html', img: '/img/my_portfolio/Tainan Police.webp',            titleKey: 'p4_title',  descKey: 'p4_desc',  tags: ['UI/UX', 'Figma'] },
  { id: 'p5',  category: 'web',    link: '/project_05.html', img: '/img/my_portfolio/zoo.webp',                      titleKey: 'p5_title',  descKey: 'p5_desc',  tags: ['Web Dev', 'Adobe XD', 'Vue'] },
  { id: 'p6',  category: 'mobile', link: '/project_06.html', img: '/img/my_portfolio/Taoyuan_MRT.webp',              titleKey: 'p6_title',  descKey: 'p6_desc',  tags: ['UI/UX', 'Adobe XD'] },
  { id: 'p7',  category: 'web',    link: '/project_07.html', img: '/img/my_portfolio/dam.webp',                      titleKey: 'p7_title',  descKey: 'p7_desc',  tags: ['Web Dev', 'HTML/CSS'] },
  { id: 'p8',  category: 'mobile', link: '/project_08.html', img: '/img/my_portfolio/stream.webp',                   titleKey: 'p8_title',  descKey: 'p8_desc',  tags: ['UI/UX', 'Adobe XD'] },
  { id: 'p9',  category: 'web',    link: '/project_09.html', img: '/img/my_portfolio/enviroment.webp',               titleKey: 'p9_title',  descKey: 'p9_desc',  tags: ['Web Dev', 'HTML/CSS'] },
  { id: 'p10', category: 'web',    link: '/project_10.html', img: '/img/my_portfolio/aviation.webp',                 titleKey: 'p10_title', descKey: 'p10_desc', tags: ['UI/UX', 'Adobe XD'] },
  { id: 'p11', category: 'web',    link: '/project_11.html', img: '/img/my_portfolio/student.webp',                  titleKey: 'p11_title', descKey: 'p11_desc', tags: ['Web Dev', 'HTML/CSS'] },
  { id: 'p12', category: 'web',    link: '/project_12.html', img: '/img/my_portfolio/coin.webp',                     titleKey: 'p12_title', descKey: 'p12_desc', tags: ['UI/UX', 'Adobe XD'] },
];
