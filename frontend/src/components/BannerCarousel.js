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
    <div className="banner-carousel-wrapper" data-testid="banner-carousel">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
        }}
        effect="fade"
        loop={banners.length > 1}
        className="banner-swiper"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div 
              className="banner-slide"
              onContextMenu={handleContextMenu}
              onDragStart={handleDragStart}
            >
              {banner.media_type === 'video' ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="banner-media"
                  onContextMenu={handleContextMenu}
                  onDragStart={handleDragStart}
                  controlsList="nodownload"
                  disablePictureInPicture
                >
                  <source src={banner.media_url} type="video/mp4" />
                </video>
              ) : (
                <img
                  src={banner.media_url}
                  alt={banner.title}
                  className="banner-media"
                  onContextMenu={handleContextMenu}
                  onDragStart={handleDragStart}
                  draggable="false"
                  loading="lazy"
                />
              )}
              
              {/* Anti-copy overlay */}
              <div className="banner-overlay-protection" />

              {/* Content overlay */}
              <div className="banner-content-overlay">
                <div className="banner-content-wrapper">
                  <h2 className="banner-title">{banner.title}</h2>
                  {banner.subtitle && (
                    <p className="banner-subtitle">{banner.subtitle}</p>
                  )}
                  {banner.link_url && (
                    <a
                      href={banner.link_url}
                      className="banner-cta"
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
    </div>
  );
};

export default BannerCarousel;