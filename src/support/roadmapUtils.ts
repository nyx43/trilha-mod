import { Level, RoadmapItem } from '../entity/RoadmapModel';
import { RoadmapRead } from '../entity/RoadmapReadModel';

export function convertToRoadmapRead(levels: Level[]): RoadmapRead[] {
  function convertItems(items: RoadmapItem[], parentLabel: string): RoadmapRead[] {
    return items.map((item) => {
      const { id, label, children, links, url } = item;

      const roadmapReadItem: RoadmapRead = {
        ...(id ? { id } : {}),
        label: `${parentLabel}-${label}`,
        read: false, // Set default value for 'read' attribute
      };

      if (children && children.length > 0) {
        roadmapReadItem.children = convertItems(children, label);
      } else if (links && links.length > 0) {
        // Handle 'links' instead of 'children'
        const sectionScope = id || `${parentLabel}-${item.label}`;
        roadmapReadItem.children = links.map((link) => ({
          ...(link.id ? { id: `${sectionScope}::${link.id}` } : {}),
          ...(link.url ? { url: link.url } : {}),
          label: `${parentLabel}-${item.label}-${link.label}`,
          read: false, // Set default value for 'read' attribute for links
        }));
      } else if (url) {
        roadmapReadItem.url = url;
      }

      return roadmapReadItem;
    });
  }

  return levels.map((level) => {
    const { id } = level;
    const items = Array.isArray(level.items) ? level.items : [];
    const levelLabel = level.label || items[0]?.label || '';
    const roadmapReadLevel: RoadmapRead = {
      ...(id ? { id } : {}),
      label: levelLabel,
      children: convertItems(items, levelLabel),
      read: false, // Set default value for 'read' attribute
    };

    return roadmapReadLevel;
  });
}

// Rebuild the current tree, preserving completed resources by stable IDs, URL+label,
// or pure legacy labels (only from saved entries that predate ID/URL tracking).
// New resources stay unchecked, even when they reuse a previous title.
export function reconcileRoadmapRead(levels: Level[], previous: RoadmapRead[]): RoadmapRead[] {
  const previousReadById = new Map<string, boolean>();
  const previousReadFromIdlessSection = new Map<string, boolean>();
  const previousReadByLabelAndUrl = new Map<string, boolean>();
  const legacyReadByLabel = new Map<string, boolean>();

  function setMerged(map: Map<string, boolean>, key: string, read: boolean) {
    map.set(key, map.get(key) === true || read);
  }

  function recordWithoutId(label: string, url: string | undefined, read: boolean) {
    if (!label) return;
    if (url) {
      setMerged(previousReadByLabelAndUrl, `${label}\0${url}`, read);
    } else {
      setMerged(legacyReadByLabel, label, read);
    }
  }

  function collect(items: RoadmapRead[], parentLabel?: string, parentHadId = false) {
    items.forEach((item) => {
      const read = item.read === true;
      if (item.id) {
        setMerged(previousReadById, item.id, read);
        if (!item.children && !parentHadId && item.label) {
          setMerged(
            previousReadFromIdlessSection,
            `${item.id}\0${item.label}\0${item.url ?? ''}`,
            read,
          );
        }
      } else {
        recordWithoutId(item.label, item.url, read);
      }

      if (item.children) {
        collect(item.children, item.label, Boolean(item.id));
      } else if (
        !item.id &&
        parentLabel &&
        item.label &&
        !item.label.startsWith(parentLabel + '-')
      ) {
        // Legacy resource IDs omitted the topic. Recover it from the stored
        // parent so identical references in different exercises stay independent.
        for (let index = 0; index < item.label.length; index++) {
          if (item.label[index] === '-' && parentLabel.endsWith('-' + item.label.slice(0, index))) {
            recordWithoutId(parentLabel + '-' + item.label.slice(index + 1), item.url, read);
            break;
          }
        }
      }
    });
  }
  collect(previous);

  function resolveLeafRead(item: RoadmapRead, parentLabel?: string): boolean {
    if (item.id && previousReadById.has(item.id)) {
      return previousReadById.get(item.id) === true;
    }
    if (item.id && parentLabel) {
      const separatorIndex = item.id.indexOf('::');
      if (separatorIndex >= 0) {
        const linkId = item.id.slice(separatorIndex + 2);
        const fallbackScopedId = `${parentLabel}::${linkId}`;
        const exactKey = `${fallbackScopedId}\0${item.label}\0${item.url ?? ''}`;
        if (previousReadFromIdlessSection.has(exactKey)) {
          return previousReadFromIdlessSection.get(exactKey) === true;
        }
        if (item.url) {
          const preUrlKey = `${fallbackScopedId}\0${item.label}\0`;
          if (previousReadFromIdlessSection.has(preUrlKey)) {
            return previousReadFromIdlessSection.get(preUrlKey) === true;
          }
        }
      }
    }
    if (item.url && item.label) {
      const key = `${item.label}\0${item.url}`;
      if (previousReadByLabelAndUrl.has(key)) {
        return previousReadByLabelAndUrl.get(key) === true;
      }
    }
    if (item.label) {
      return legacyReadByLabel.get(item.label) === true;
    }
    return false;
  }

  function restore(items: RoadmapRead[], parentLabel?: string): RoadmapRead[] {
    return items.map((item) => {
      const children = item.children ? restore(item.children, item.label) : undefined;
      return {
        ...item,
        ...(children ? { children } : {}),
        read: children?.length
          ? children.every((child) => child.read === true)
          : resolveLeafRead(item, parentLabel),
      };
    });
  }

  return restore(convertToRoadmapRead(levels));
}

export function updateReadAttribute(
  labelToFind: string,
  readValue: boolean,
  setSelectedItems: (items: RoadmapRead[]) => void,
  selectedItems: RoadmapRead[],
) {
  if (!labelToFind) return;
  const newData = selectedItems;

  const updateChildrenRead = (children: RoadmapRead[], value: boolean) => {
    for (const child of children) {
      child.read = value;
      if (child.children && child.children.length > 0) {
        updateChildrenRead(child.children, value);
      }
    }
  };

  const updateRead = (items: RoadmapRead[]): boolean => {
    let found = false;

    for (const item of items) {
      if (item.label === labelToFind) {
        item.read = readValue;
        found = true;
        if (item.children && item.children.length > 0) {
          // Update the children based on the parent's readValue
          updateChildrenRead(item.children, readValue);
        }
      } else if (item.children && item.children.length > 0) {
        // Recursively update the children
        const childUpdated = updateRead(item.children);
        if (childUpdated) {
          item.read = item.children.every((child) => !!child.read);
          found = true;
        }
      }
    }

    return found;
  };

  if (updateRead(newData)) {
    setSelectedItems([...newData]);
  }
}

export function isRead(labelToFind: string, selectedItems: RoadmapRead[]) {
  if (!labelToFind) return false;
  function searchItem(items: RoadmapRead[]): boolean {
    for (const item of items || []) {
      if (item.label === labelToFind && item.read === true) {
        return true;
      }
      if (item.children && item.children.length > 0) {
        const found = searchItem(item.children);
        if (found) return true;
      }
    }
    return false;
  }
  return searchItem(selectedItems);
}

export function findRoadmapReadItem(
  labelToFind?: string,
  selectedItems?: RoadmapRead[] | undefined,
) {
  if (!labelToFind || !selectedItems) return undefined;

  const target = labelToFind;
  const normalizedTarget = labelToFind.toLowerCase();
  let foundItem: RoadmapRead | undefined;

  function searchItem(items: RoadmapRead[]): void {
    for (const item of items || []) {
      const parts = item.label.split('-');
      if (
        item.label === target ||
        (parts.length > 1 && parts.slice(1).join('-').toLowerCase() === normalizedTarget) ||
        (parts.length >= 3 && parts.slice(2).join('-').toLowerCase() === normalizedTarget)
      ) {
        foundItem = item;
        break;
      }
      if (item.children && item.children.length > 0) {
        searchItem(item.children);
      }
    }
  }

  searchItem(selectedItems);

  return foundItem;
}
