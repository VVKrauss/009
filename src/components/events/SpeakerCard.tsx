import { User } from 'lucide-react';

type SpeakerCardProps = {
  speaker: {
    id: string;
    name: string;
    field_of_expertise: string;
    description: string;
    photos: { url: string; isMain?: boolean }[];
  };
};

const SpeakerCard = ({ speaker }: SpeakerCardProps) => {
  const mainPhoto = speaker.photos?.find(photo => photo.isMain) || speaker.photos?.[0];

  return (
    <div className="bg-white dark:bg-dark-800 rounded-lg p-6 shadow-sm">
      {/* Верхний ряд с фото, именем и сферой интересов */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
        {/* Контейнер для фото */}
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24" style={{ 
            clipPath: 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)',
            shapeRendering: 'geometricPrecision'
          }}>
            {mainPhoto?.url ? (
              <img
                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/${mainPhoto.url}`}
                alt={speaker.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/300?text=No+image';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-dark-700">
                <User className="w-10 h-10 text-gray-400" />
              </div>
            )}
          </div>
        </div>
        
        {/* Блок с именем и сферой интересов */}
        <div className="text-center sm:text-left">
          <h3 className="text-xl font-semibold">{speaker.name}</h3>
          <p className="text-primary-600 dark:text-primary-400 mt-1">
            {speaker.field_of_expertise}
          </p>
        </div>
      </div>
      
      {/* Нижний блок с описанием */}
      <div className="pt-4 border-t border-gray-200 dark:border-dark-700">
        <p className="text-dark-600 dark:text-dark-300">
          {speaker.description}
        </p>
      </div>
    </div>
  );
};

export default SpeakerCard;