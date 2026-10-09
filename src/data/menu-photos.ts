import drinkPhotos from './drink-photos.json';
// Explicit position-to-photo assignments. Sources: PAPPARE-YANDEX-EDA and PAPPARE-YANDEX-DRINKS.
export type MenuDishPhoto = { src: string; label: string; caption?: string; aspect?: 'square' };
const drinkPhotoMap=drinkPhotos as Record<string,MenuDishPhoto[]>;

const menuPhotos: Record<string, MenuDishPhoto[]> = {
  "breakfast|breakfast-panini|Панини с курицей и грибами": [
    {
      "src": "/assets/menu-20261008/dish-001.jpg",
      "label": "Панини с курицей и грибами"
    }
  ],
  "breakfast|breakfast-panini|Панини с лососем": [
    {
      "src": "/assets/menu-20261008/dish-002.jpg",
      "label": "Панини с лососем"
    }
  ],
  "breakfast|breakfast-panini|Мини фокачча с лососем и яйцом пашот": [
    {
      "src": "/assets/menu-20261008/dish-003.jpg",
      "label": "Мини фокачча с лососем и яйцом пашот"
    }
  ],
  "breakfast|breakfast-panini|Мини фокачча с ростбифом и томатами": [
    {
      "src": "/assets/menu-20261008/dish-004.jpg",
      "label": "Мини фокачча с ростбифом и томатами"
    }
  ],
  "breakfast|breakfast-panini|Драники": [
    {
      "src": "/assets/menu-corrections-20261009/potato-pancakes.webp",
      "label": "Драники"
    }
  ],
  "breakfast|breakfast-panini|Вафли из цукини": [
    {
      "src": "/assets/menu-corrections-20261009/zucchini-waffles.webp",
      "label": "Вафли из цукини"
    }
  ],
  "breakfast|breakfast-porridge|Овсяная каша": [
    {
      "src": "/assets/menu-20261008/dish-007.jpg",
      "label": "Овсяная каша"
    }
  ],
  "breakfast|breakfast-porridge|Рисовая каша": [
    {
      "src": "/assets/menu-20261008/dish-008.jpg",
      "label": "Рисовая каша"
    }
  ],
  "breakfast|breakfast-porridge|Пшённая каша": [
    {
      "src": "/assets/menu-20261008/dish-009.jpg",
      "label": "Пшённая каша"
    }
  ],
  "breakfast|breakfast-eggs|Скрембл": [
    {
      "src": "/assets/menu-corrections-20261009/scramble.webp",
      "label": "Скрембл"
    }
  ],
  "breakfast|breakfast-eggs|Глазунья": [
    {
      "src": "/assets/menu-corrections-20261009/sunny-side-up.webp",
      "label": "Глазунья"
    }
  ],
  "breakfast|breakfast-eggs|Омлет": [
    {
      "src": "/assets/menu-corrections-20261009/omelette.webp",
      "label": "Омлет"
    }
  ],
  "breakfast|breakfast-eggs|Шакшука нажористая": [
    {
      "src": "/assets/menu-20261008/dish-013.jpg",
      "label": "Шакшука нажористая"
    }
  ],
  "breakfast|breakfast-eggs|Каша + 2 добавки": [
    {
      "src": "/assets/menu-20261008/dish-014.jpg",
      "label": "Каша + 2 добавки",
      "caption": "Пример комплектации"
    }
  ],
  "breakfast|breakfast-eggs|Яйца + 2 добавки + кофе": [
    {
      "src": "/assets/menu-20261008/dish-015.jpg",
      "label": "Яйца + 2 добавки + кофе",
      "caption": "Пример комплектации"
    }
  ],
  "breakfast|breakfast-extras|Бекон": [
    {
      "src": "/assets/menu-20261008/dish-016.jpg",
      "label": "Бекон"
    }
  ],
  "breakfast|breakfast-extras|Говяжья вырезка": [
    {
      "src": "/assets/menu-20261008/dish-017.jpg",
      "label": "Говяжья вырезка"
    }
  ],
  "breakfast|breakfast-extras|Креветки": [
    {
      "src": "/assets/menu-20261008/dish-018.jpg",
      "label": "Креветки"
    }
  ],
  "breakfast|breakfast-extras|Моцарелла": [
    {
      "src": "/assets/menu-20261008/dish-019.jpg",
      "label": "Моцарелла"
    }
  ],
  "breakfast|breakfast-extras|Пармезан": [
    {
      "src": "/assets/menu-20261008/dish-020.jpg",
      "label": "Пармезан"
    }
  ],
  "breakfast|breakfast-extras|Пепперони": [
    {
      "src": "/assets/menu-20261008/dish-021.jpg",
      "label": "Пепперони"
    }
  ],
  "breakfast|breakfast-extras|Куриные сосиски": [
    {
      "src": "/assets/menu-20261008/dish-022.jpg",
      "label": "Куриные сосиски"
    }
  ],
  "breakfast|breakfast-extras|Конфитюр брусника / вишня": [
    {
      "src": "/assets/menu-20261008/dish-023.jpg",
      "label": "Конфитюр брусника"
    },
    {
      "src": "/assets/menu-20261008/dish-024.jpg",
      "label": "Конфитюр вишня"
    }
  ],
  "breakfast|breakfast-extras|Шоколад": [
    {
      "src": "/assets/menu-20261008/dish-025.jpg",
      "label": "Шоколад"
    }
  ],
  "breakfast|breakfast-extras|Кедровый орех": [
    {
      "src": "/assets/menu-20261008/dish-026.jpg",
      "label": "Кедровый орех"
    }
  ],
  "breakfast|breakfast-extras|Грецкий орех": [
    {
      "src": "/assets/menu-20261008/dish-027.jpg",
      "label": "Грецкий орех"
    }
  ],
  "main|starters|Вителло тоннато": [
    {
      "src": "/assets/menu-20261008/dish-028.jpg",
      "label": "Вителло тоннато"
    }
  ],
  "main|starters|Карпаччо из рибая": [
    {
      "src": "/assets/menu-20261008/dish-029.jpg",
      "label": "Карпаччо из рибая"
    }
  ],
  "main|starters|Тар-тар из говядины": [
    {
      "src": "/assets/menu-20261008/dish-030.jpg",
      "label": "Тар-тар из говядины"
    }
  ],
  "main|starters|Тар-тар из лосося": [
    {
      "src": "/assets/menu-corrections-20261009/salmon-tartare.webp",
      "label": "Тар-тар из лосося"
    }
  ],
  "main|salads|Нисуаз": [
    {
      "src": "/assets/menu-20261008/dish-032.jpg",
      "label": "Нисуаз"
    }
  ],
  "main|salads|Салат с креветками": [
    {
      "src": "/assets/menu-20261008/dish-033.jpg",
      "label": "Салат с креветками"
    }
  ],
  "main|salads|Салат с сёмгой и манго": [
    {
      "src": "/assets/menu-corrections-20261009/salmon-mango-salad.webp",
      "label": "Салат с сёмгой и манго"
    }
  ],
  "main|salads|Цезарь с креветкой": [
    {
      "src": "/assets/menu-20261008/dish-035.jpg",
      "label": "Цезарь с креветкой"
    }
  ],
  "main|salads|Цезарь с курицей": [
    {
      "src": "/assets/menu-20261008/dish-036.jpg",
      "label": "Цезарь с курицей"
    }
  ],
  "main|salads|Цезарь с сёмгой": [
    {
      "src": "/assets/menu-20261008/dish-037.jpg",
      "label": "Цезарь с сёмгой"
    }
  ],
  "main|hot|Томлёные щёчки в морковном креме с соусом демигляс": [
    {
      "src": "/assets/menu-20261008/dish-038.jpg",
      "label": "Томлёные щёчки в морковном креме с соусом демигляс"
    }
  ],
  "main|hot|Куриная грудка со сливочно-грибным соусом": [
    {
      "src": "/assets/menu-20261008/dish-039.jpg",
      "label": "Куриная грудка со сливочно-грибным соусом"
    }
  ],
  "main|hot|Стейк из лосося с кремом из шпината": [
    {
      "src": "/assets/menu-20261008/dish-040.jpg",
      "label": "Стейк из лосося с кремом из шпината"
    }
  ],
  "main|pasta|Паста болоньезе": [
    {
      "src": "/assets/menu-20261008/dish-041.jpg",
      "label": "Паста болоньезе"
    }
  ],
  "main|pasta|Паста карбонара": [
    {
      "src": "/assets/menu-20261008/dish-042.jpg",
      "label": "Паста карбонара"
    }
  ],
  "main|pasta|Паста с креветками": [
    {
      "src": "/assets/menu-20261008/dish-043.jpg",
      "label": "Паста с креветками"
    }
  ],
  "main|pasta|Паста с курицей и грибами": [
    {
      "src": "/assets/menu-20261008/dish-044.jpg",
      "label": "Паста с курицей и грибами"
    }
  ],
  "main|pasta|Паста с томлёными щёчками": [
    {
      "src": "/assets/menu-20261008/dish-045.jpg",
      "label": "Паста с томлёными щёчками"
    }
  ],
  "main|pizza|Маргарита": [
    {
      "src": "/assets/menu-20261008/dish-046.jpg",
      "label": "Маргарита"
    }
  ],
  "main|pizza|Пепперони": [
    {
      "src": "/assets/menu-20261008/dish-047.jpg",
      "label": "Пепперони"
    }
  ],
  "main|pizza|Мясная пицца": [
    {
      "src": "/assets/menu-20261008/dish-048.jpg",
      "label": "Мясная пицца"
    }
  ],
  "main|pizza|Карбонара": [
    {
      "src": "/assets/menu-20261008/dish-049.jpg",
      "label": "Карбонара"
    }
  ],
  "main|pizza|Пицца с креветками": [
    {
      "src": "/assets/menu-20261008/dish-050.jpg",
      "label": "Пицца с креветками"
    }
  ],
  "main|pizza|Пицца с курицей и грибами": [
    {
      "src": "/assets/menu-20261008/dish-051.jpg",
      "label": "Пицца с курицей и грибами"
    }
  ],
  "evening|evening-burgers|Фирменный Паппарэ": [
    {
      "src": "/assets/menu-20261008/dish-052.jpg",
      "label": "Фирменный Паппарэ"
    }
  ],
  "evening|evening-burgers|Чизбургер": [
    {
      "src": "/assets/menu-20261008/dish-053.jpg",
      "label": "Чизбургер"
    }
  ],
  "evening|evening-burgers|Чикенбургер": [
    {
      "src": "/assets/menu-20261008/dish-054.jpg",
      "label": "Чикенбургер"
    }
  ],
  "evening|evening-chimichanga|С курицей": [
    {
      "src": "/assets/menu-20261008/dish-055.jpg",
      "label": "С курицей"
    }
  ],
  "evening|evening-chimichanga|С мясом": [
    {
      "src": "/assets/menu-20261008/dish-056.jpg",
      "label": "С мясом"
    }
  ],
  "evening|evening-chimichanga|С рыбой": [
    {
      "src": "/assets/menu-20261008/dish-057.jpg",
      "label": "С рыбой"
    }
  ],
  "evening|evening-chimichanga|Сырная": [
    {
      "src": "/assets/menu-20261008/dish-058.jpg",
      "label": "Сырная"
    }
  ],
  "evening|evening-extras|Бекон": [
    {
      "src": "/assets/menu-20261008/dish-016.jpg",
      "label": "Бекон"
    }
  ],
  "evening|evening-extras|Говяжья вырезка": [
    {
      "src": "/assets/menu-20261008/dish-017.jpg",
      "label": "Говяжья вырезка"
    }
  ],
  "evening|evening-extras|Креветки": [
    {
      "src": "/assets/menu-20261008/dish-018.jpg",
      "label": "Креветки"
    }
  ],
  "evening|evening-extras|Моцарелла": [
    {
      "src": "/assets/menu-20261008/dish-019.jpg",
      "label": "Моцарелла"
    }
  ],
  "evening|evening-extras|Пармезан": [
    {
      "src": "/assets/menu-20261008/dish-020.jpg",
      "label": "Пармезан"
    }
  ],
  "evening|evening-extras|Пепперони": [
    {
      "src": "/assets/menu-20261008/dish-021.jpg",
      "label": "Пепперони"
    }
  ],
  "evening|evening-extras|Куриные сосиски": [
    {
      "src": "/assets/menu-20261008/dish-022.jpg",
      "label": "Куриные сосиски"
    }
  ],
  "evening|evening-fried|Картофель фри": [
    {
      "src": "/assets/menu-20261008/dish-059.jpg",
      "label": "Картофель фри"
    }
  ],
  "evening|evening-fried|Куриный попкорн": [
    {
      "src": "/assets/menu-20261008/dish-060.jpg",
      "label": "Куриный попкорн"
    }
  ],
  "evening|evening-fried|Сырные шарики": [
    {
      "src": "/assets/menu-20261008/dish-061.jpg",
      "label": "Сырные шарики"
    }
  ],
  "evening|evening-fried|Кольца кальмара": [
    {
      "src": "/assets/menu-20261008/dish-062.jpg",
      "label": "Кольца кальмара"
    }
  ],
  "evening|evening-fried|Чипсы": [
    {
      "src": "/assets/menu-20261008/dish-063.jpg",
      "label": "Чипсы"
    }
  ],
  "evening|evening-fried|Сыр-косичка": [
    {
      "src": "/assets/menu-20261008/dish-064.jpg",
      "label": "Сыр-косичка"
    }
  ],
  "evening|evening-set|Шесть закусок и два соуса": [
    {
      "src": "/assets/menu-20261008/dish-065.jpg",
      "label": "Шесть закусок и два соуса"
    }
  ],
  "lunch|lunch-set|Суп + основное блюдо + салат + чай": [
    {
      "src": "/assets/menu-20261008/dish-066.jpg",
      "label": "Суп + основное блюдо + салат + чай",
      "caption": "Пример комплектации"
    }
  ],
  "lunch|lunch-soups|Борщ с говядиной": [
    {
      "src": "/assets/menu-20261008/dish-067.jpg",
      "label": "Борщ с говядиной"
    }
  ],
  "lunch|lunch-soups|Куриный суп с лапшой (сливочный)": [
    {
      "src": "/assets/menu-20261008/dish-068.jpg",
      "label": "Куриный суп с лапшой (сливочный)"
    }
  ],
  "lunch|lunch-soups|Грибной крем-суп": [
    {
      "src": "/assets/menu-20261008/dish-069.jpg",
      "label": "Грибной крем-суп"
    }
  ],
  "lunch|lunch-main|Булгур с говядиной в томатном соусе": [
    {
      "src": "/assets/menu-20261008/dish-070.jpg",
      "label": "Булгур с говядиной в томатном соусе"
    }
  ],
  "lunch|lunch-main|Курица с картофельным пюре": [
    {
      "src": "/assets/menu-20261008/dish-071.jpg",
      "label": "Курица с картофельным пюре"
    }
  ],
  "lunch|lunch-main|Паста с красной рыбой": [
    {
      "src": "/assets/menu-20261008/dish-072.jpg",
      "label": "Паста с красной рыбой"
    }
  ],
  "lunch|lunch-salads|Оливье с говядиной": [
    {
      "src": "/assets/menu-20261008/dish-073.jpg",
      "label": "Оливье с говядиной"
    }
  ],
  "lunch|lunch-salads|Салат с курицей и грибами": [
    {
      "src": "/assets/menu-20261008/dish-074.jpg",
      "label": "Салат с курицей и грибами"
    }
  ],
  "lunch|lunch-salads|Свекла с сыром фета": [
    {
      "src": "/assets/menu-20261008/dish-075.jpg",
      "label": "Свекла с сыром фета"
    }
  ],
  "kids|kids|Куриный супчик": [
    {
      "src": "/assets/menu-20261008/dish-076.jpg",
      "label": "Куриный супчик"
    }
  ],
  "kids|kids|Бантики с курицей в сливках": [
    {
      "src": "/assets/menu-20261008/dish-077.jpg",
      "label": "Бантики с курицей в сливках"
    }
  ],
  "kids|kids|Бантики с куриными колбасками": [
    {
      "src": "/assets/menu-20261008/dish-078.jpg",
      "label": "Бантики с куриными колбасками"
    }
  ],
  "kids|kids|Сырники с джемом": [
    {
      "src": "/assets/menu-20261008/dish-079.jpg",
      "label": "Сырники с джемом"
    }
  ],
  "kids|kids|Кальцоне с сыром и томатами": [
    {
      "src": "/assets/menu-20261008/dish-080.jpg",
      "label": "Кальцоне с сыром и томатами"
    }
  ],
  "kids|kids|Кальцоне с курицей и сыром": [
    {
      "src": "/assets/menu-20261008/dish-081.jpg",
      "label": "Кальцоне с курицей и сыром"
    }
  ]
};

export function getMenuPhotos(groupId: string, sectionId: string, itemName: string): MenuDishPhoto[] {
  const key=[groupId, sectionId, itemName].join("|");
  return drinkPhotoMap[key] || menuPhotos[key] || [];
}
