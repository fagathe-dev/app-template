import { fetchAPI } from '../utils/fetch';
import { URLHandler } from '../utils/url';

const deleteFeature = async (e: MouseEvent) => {
  e.preventDefault();
  const targetElement = e.target as HTMLElement | HTMLAnchorElement;
  const url: string =
    targetElement.tagName !== 'A'
      ? (targetElement.closest('a[href]') as HTMLAnchorElement).href
      : (targetElement as HTMLAnchorElement).href;

  if (confirm('Êtes-vous sûr de vouloir supprimer cette fonctionnalité ?')) {
    try {
      const res = await fetchAPI(url, {
        method: 'DELETE',
      });

      if (res.ok) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
        window.location.reload();
      } else {
        console.error('Erreur lors de la suppression de la fonctionnalité.');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  }
};

const xyz = URLHandler.getAllURLParams();
