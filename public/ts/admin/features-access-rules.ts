import { Alert } from '../components/Alert';
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
        new Alert('La fonctionnalité a été supprimée avec succès 🚀');

        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth',
          });
          window.location.reload();
        }, 4000);
      } else {
        console.error('Erreur lors de la suppression de la fonctionnalité.');
        new Alert('Erreur lors de la suppression de la fonctionnalité.', 'danger');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la fonctionnalité.');
      console.error('Erreur:', error);
    }
  }
};

const xyz = URLHandler.getAllURLParams();
