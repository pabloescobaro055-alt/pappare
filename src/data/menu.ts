export type MenuItem = {
  name: string;
  description: string;
  weight: string;
  price: string;
};

export type MenuSection = {
  id: string;
  title: string;
  intro: string;
  items: MenuItem[];
};

export type MenuGroup = {
  id: string;
  title: string;
  description: string;
  sections: MenuSection[];
};

export { currentMenuGroups as menuGroups } from "./current-menu";
