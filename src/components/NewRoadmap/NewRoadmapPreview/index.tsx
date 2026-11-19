import { useMemo } from 'react';
import { RoadmapModel } from '../../../entity/RoadmapModel';
import Roadmap from '../../Roadmap';

type Props = {
  roadmap: RoadmapModel;
};

export default function NewRoadmapPreview(props: Props) {
  // O editor emite um novo rascunho a cada edição e pode reutilizar o array de níveis.
  const levels = useMemo(() => [...(props.roadmap.levels ?? [])], [props.roadmap]);

  return (
    <>
      <h2 className="mb-4 ml-2 text-center font-title text-2xl text-light-orange">Preview</h2>
      <div className="h-full w-full rounded-sm bg-dark-brown pt-8">
        {levels.length > 0 && (
          <Roadmap
            isPreview={true}
            data={levels}
            name={props.roadmap.title || ''}
            title={props.roadmap.title || ''}
            roadmapPath={props.roadmap.slug || ''}
          />
        )}
        {levels.length === 0 && (
          <p className="w-full text-center text-yellow">
            Comece a criar seu Roadmap e veja aqui como ele está ficando.
          </p>
        )}
      </div>
    </>
  );
}
