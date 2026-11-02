const photo = (id) => new URL(`../photos/${id}.webp`, import.meta.url).href;

export const stories = [
  {
    id: 'summer', number: '01', title: 'Пока ещё лето', category: 'outdoor',
    label: 'ПРОГУЛКА · ЕСТЕСТВЕННЫЙ СВЕТ', cover: 3442,
    description: 'Тёплый свет, красный цветок и немного времени для себя. Летняя портретная история на природе.',
    images: [3442, 3441, 3443, 3444, 3445, 3446, 3447],
    coverAlt: 'Девушка с красным цветком в волосах в лучах летнего солнца',
    note: 'то самое лето', size: 'large', source: 'https://t.me/martashkapipi/3441',
  },
  {
    id: 'studio', number: '02', title: 'Другой свет', category: 'studio',
    label: 'СТУДИЯ · ПОРТРЕТ', cover: 3558,
    description: 'Несколько образов и настроений. Графичные силуэты, чёрно-белые портреты и красный фон.',
    images: [3558, 3560, 3557, 3559, 3555, 3556, 3551, 3552, 3553, 3554],
    coverAlt: 'Студийный портрет девушки в чёрном кружевном платье на тёмном фоне',
    note: 'чуть смелее', size: 'small', source: 'https://t.me/martashkapipi/3551',
  },
  {
    id: 'lilies', number: '03', title: 'Тихое утро', category: 'studio',
    label: 'СТУДИЯ · ИНДИВИДУАЛЬНАЯ СЪЁМКА', cover: 3076,
    description: 'Белые лилии, мягкий свет и оливковый фон. Спокойная портретная серия в студии.',
    images: [3076, 3075, 3077, 3080, 3079, 3078, 3081, 3082, 3083],
    coverAlt: 'Девушка в белой блузе с букетом лилий на оливковом фоне',
    note: 'никуда не спешить', size: 'small', source: 'https://t.me/martashkapipi/3075',
  },
  {
    id: 'birthday', number: '04', title: 'День для себя', category: 'outdoor',
    label: 'ГОРОД · ДЕНЬ РОЖДЕНИЯ', cover: 3532,
    description: 'Букет, осенний город и день рождения. Повод сделать себе подарок и сохранить этот момент.',
    images: [3532, 3533, 3531, 3537, 3534, 3535, 3536, 3538, 3539],
    coverAlt: 'Девушка с бордовым букетом на осенней городской прогулке',
    note: 'подарок себе', size: 'large', source: 'https://t.me/martashkapipi/3531',
  },
].map((story) => ({ ...story, coverUrl: photo(story.cover), photos: story.images.map(photo) }));
