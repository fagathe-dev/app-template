// public/js/features-access-rules.js
async function deleteFeature (e) {
  e.preventDefault();
  const url = (e.target.tagName !== 'A' ? e.target.closest('a[href]') : e.target).getAttribute('href');

  if (confirm('Êtes-vous sûr de vouloir supprimer cette fonctionnalité ?')) {
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
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
      alert("Une erreur s'est produite lors de la suppression de la fonctionnalité.");
    }
  }
};
