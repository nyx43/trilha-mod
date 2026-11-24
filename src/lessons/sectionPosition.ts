export interface SectionPosition {
  sectionId: string;
  previousSectionIds: string[];
}

export function sectionPosition(ids: readonly string[], index: number): SectionPosition {
  return { sectionId: ids[index], previousSectionIds: ids.slice(0, index) };
}

export function resolveSectionPosition(
  ids: readonly string[],
  saved: SectionPosition | undefined,
  legacyIndex: number | undefined,
  legacyIds: readonly string[] | undefined,
): number {
  const legacy =
    legacyIds?.length && typeof legacyIndex === 'number' && Number.isInteger(legacyIndex)
      ? sectionPosition(legacyIds, Math.max(0, Math.min(legacyIndex, legacyIds.length - 1)))
      : undefined;
  const position = saved ?? legacy;
  if (!position) return 0;
  const target = ids.indexOf(position.sectionId);
  if (target >= 0) return target;
  const previous = Array.isArray(position.previousSectionIds) ? position.previousSectionIds : [];
  for (let index = previous.length - 1; index >= 0; index--) {
    const candidate = ids.indexOf(previous[index]);
    if (candidate >= 0) return candidate;
  }
  return 0;
}
