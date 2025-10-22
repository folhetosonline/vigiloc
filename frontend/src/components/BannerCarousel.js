import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import axios from "axios";
import { API } from "@/App";

const BannerCarousel = () => {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await axios.get(`${API}/banners`);
      setBanners(response.data);
    } catch (error) {
      console.error("Erro ao carregar banners:", error);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  const handleDragStart = (e) => {
    e.preventDefault();
    return false;
  };

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className="banner-carousel relative" data-testid="banner-carousel">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        effect="fade"
        loop={banners.length > 1}
        className="h-[600px] w-full"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div 
              className="relative h-full w-full"
              onContextMenu={handleContextMenu}
              onDragStart={handleDragStart}
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              {banner.media_type === 'video' ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                  onContextMenu={handleContextMenu}
                  onDragStart={handleDragStart}
                  controlsList="nodownload"
                  disablePictureInPicture
                  style={{ pointerEvents: 'none' }}
                >
                  <source src={banner.media_url} type="video/mp4" />
                </video>
              ) : (
                <img
                  src={banner.media_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  onContextMenu={handleContextMenu}
                  onDragStart={handleDragStart}
                  draggable="false"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              
              {/* Overlay to prevent copying */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'transparent' }}
              />

              {/* Content overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end">
                <div className="p-12 text-white max-w-4xl">
                  <h2 className="text-5xl font-bold mb-4">{banner.title}</h2>
                  {banner.subtitle && (
                    <p className="text-xl mb-6 opacity-90">{banner.subtitle}</p>
                  )}
                  {banner.link_url && (
                    <a
                      href={banner.link_url}
                      className="inline-block bg-white text-blue-700 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors pointer-events-auto"
                      style={{ pointerEvents: 'auto' }}
                    >
                      Saiba Mais
                    </a>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      <style jsx>{`
        .banner-carousel img::selection,
        .banner-carousel video::selection {
          background: transparent;
        }
        .banner-carousel img::-moz-selection,
        .banner-carousel video::-moz-selection {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default BannerCarousel;