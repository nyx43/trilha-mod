import * as RadixAccordion from '@radix-ui/react-accordion';
import s from './CourseAccordion.module.css';
import { BsChevronDown } from 'react-icons/bs';
import { Level, Link } from '../../entity/RoadmapModel';
import { CourseCheckbox } from '../CourseCheckbox';
import { RoadmapRead } from '../../entity/RoadmapReadModel';

export const AccordionContainer = RadixAccordion.Root;
export const AccordionItem = RadixAccordion.Item;
export const AccordionHeader = RadixAccordion.Header;
export const AccordionContent = RadixAccordion.Content;

export type CourseLinkSelection = {
  levelLabel: string;
  itemLabel: string;
  childLabel: string;
};

type CourseAccordionProps = {
  section: Level;
  saveRead: (checked: boolean) => void;
  setActiveLink: (link: Link, context?: CourseLinkSelection) => void;
  currentEntry?: CourseLinkSelection & { link: Link };
  activeLevel?: string;
  setActiveLevel?: (level: string) => void;
  activeItem?: string;
  setActiveItem?: (item: string) => void;
  activeChild?: string;
  setActiveChild?: (child: string) => void;
  updateReadAttribute: (
    label: string,
    checked: boolean,
    setSelectedItems: (items: RoadmapRead[]) => void,
    selectedItems: RoadmapRead[],
  ) => void;
  isRead: (label: string, selectedItems: RoadmapRead[]) => boolean;
  selectedItems: RoadmapRead[];
  setSelectedItems: (items: RoadmapRead[]) => void;
};

export function CourseAccordion({
  section,
  setActiveLink,
  currentEntry,
  activeItem,
  activeChild,
  setActiveChild,
  updateReadAttribute,
  setActiveItem,
  isRead,
  selectedItems,
  setSelectedItems,
}: CourseAccordionProps) {
  const levelLabel = section.label || section.items[0]?.label || '';

  return (
    <AccordionItem
      value={levelLabel}
      className={`${s.CourseItem} bg-[#342B30] text-xs font-normal`}
    >
      <AccordionHeader className={s.Header}>
        <CourseCheckbox
          checked={isRead(levelLabel, selectedItems)}
          toggleChecked={(checked: boolean) => {
            updateReadAttribute(levelLabel, checked, setSelectedItems, selectedItems);
          }}
        />
        <AccordionTrigger className={s.CourseTrigger}>
          <span
            className={`text-text-primary ${
              isRead(levelLabel, selectedItems) ? 'line-through' : ''
            }`}
          >
            {levelLabel}
          </span>
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent className={s.CourseContent}>
        <AccordionContainer
          className="w-full"
          collapsible
          type="single"
          value={activeItem}
          onValueChange={setActiveItem}
        >
          {section.items.map((item) => {
            const itemReadLabel = `${levelLabel}-${item.label}`;
            return (
              <AccordionItem
                key={item.id || item.label}
                value={item.label || ''}
                className={`${s.CourseItem} bg-[#2D2329] font-normal`}
              >
                <AccordionHeader className={s.Header}>
                  <CourseCheckbox
                    checked={isRead(itemReadLabel, selectedItems)}
                    toggleChecked={(checked: boolean) =>
                      updateReadAttribute(itemReadLabel, checked, setSelectedItems, selectedItems)
                    }
                  />
                  <AccordionTrigger className={s.Trigger}>
                    <span
                      className={`ml-2 text-text-primary ${
                        isRead(itemReadLabel, selectedItems) ? 'line-through' : ''
                      }`}
                    >
                      {item.label}
                    </span>
                  </AccordionTrigger>
                </AccordionHeader>
                <AccordionContent className={s.CourseContent}>
                  {item.children?.map((child) => {
                    const childReadLabel = `${item.label}-${child.label}`;
                    return (
                      <AccordionContainer
                        key={child.id || child.label}
                        value={activeChild}
                        onValueChange={setActiveChild}
                        className="w-full"
                        collapsible
                        type="single"
                      >
                        <AccordionItem
                          key={child.id || child.label}
                          value={child.label || ''}
                          className={`${s.CourseItem} bg-[#261C21] font-normal`}
                        >
                          <AccordionHeader className={s.Header}>
                            <CourseCheckbox
                              checked={isRead(childReadLabel, selectedItems)}
                              toggleChecked={(checked: boolean) =>
                                updateReadAttribute(
                                  childReadLabel,
                                  checked,
                                  setSelectedItems,
                                  selectedItems,
                                )
                              }
                            />
                            <AccordionTrigger className={s.Trigger}>
                              <span
                                className={`ml-3 text-text-primary ${
                                  isRead(childReadLabel, selectedItems) ? 'line-through' : ''
                                }`}
                              >
                                {child.label}
                              </span>
                            </AccordionTrigger>
                          </AccordionHeader>
                          <AccordionContent>
                            {child.links?.map((link) => {
                              const linkReadLabel = `${item.label}-${child.label}-${link.label}`;
                              const isCurrentLink =
                                currentEntry?.link === link &&
                                currentEntry.levelLabel === levelLabel &&
                                currentEntry.itemLabel === item.label &&
                                currentEntry.childLabel === child.label;

                              return (
                                <div
                                  key={link.id || link.label}
                                  className={`flex gap-2 px-4  py-4 text-left ${
                                    isCurrentLink ? 'border-r-4 border-r-primary bg-[#501F3A]' : ''
                                  }`}
                                >
                                  <CourseCheckbox
                                    checked={isRead(linkReadLabel, selectedItems)}
                                    toggleChecked={(checked: boolean) =>
                                      updateReadAttribute(
                                        linkReadLabel,
                                        checked,
                                        setSelectedItems,
                                        selectedItems,
                                      )
                                    }
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveLink(link, {
                                        levelLabel,
                                        itemLabel: item.label,
                                        childLabel: child.label,
                                      })
                                    }
                                    className={`my-auto ml-4 text-left text-text-primary hover:underline ${
                                      isRead(linkReadLabel, selectedItems) ? 'line-through' : ''
                                    }`}
                                  >
                                    {link.label}
                                  </button>
                                </div>
                              );
                            })}{' '}
                          </AccordionContent>
                        </AccordionItem>
                      </AccordionContainer>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </AccordionContainer>
      </AccordionContent>
    </AccordionItem>
  );
}

type AccordionTriggerProps = RadixAccordion.AccordionTriggerProps &
  React.RefAttributes<HTMLButtonElement> & {
    arrowDownClassName?: string;
  };

export function AccordionTrigger({
  arrowDownClassName,
  children,
  ...triggerProps
}: AccordionTriggerProps) {
  return (
    <RadixAccordion.Trigger {...triggerProps}>
      {children}
      <BsChevronDown aria-hidden className={`${s.Icon} ${arrowDownClassName}`} />
    </RadixAccordion.Trigger>
  );
}
