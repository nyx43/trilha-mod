export type RoadmapRead = {
  id?: string;
  url?: string;
  label: string;
  children?: RoadmapRead[];
  read?: boolean;
};
