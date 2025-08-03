import { Alert } from '../components/Alert';
import { ApiError, fetchPUT } from '../utils/fetch';
import { FormManager } from '../utils/form';

const editForm = new FormManager({
  form: document.getElementById('editUserInfosForm') as HTMLFormElement,
});

const handleEditFormSubmit = async (e: SubmitEvent) => {
  e.preventDefault();
  const data = editForm.getData();
  const actionUrl = editForm.getForm().getAttribute('action') as string;

  try {
    const response = await fetchPUT(actionUrl, data);

    if (response.ok) {
      // Handle successful user creation, e.g., redirect or show a success message
      const responseData = response.data as Record<string, any>;
      // Optionally, you can redirect to another page or update the UI
      if (data?.message) {
        new Alert(responseData.message as string, 'success', {
          containerId: 'editUserInfosAlert',
          duration: 5000,
          dismissible: true,
        });
      }
    } else {
      if (response.status === 400) {
        const responseData = (response as ApiError).data as { violations?: any };

        if (responseData.violations) {
          responseData.violations.message
            ? (new Alert(responseData.violations.message, 'danger', {
                containerId: 'editUserInfosAlert',
                dismissible: true,
              }),
              delete responseData.violations.message)
            : editForm.handleViolations(responseData.violations);
        }
      }
    }
  } catch (error) {
    console.error('Failed to create user : ', error);
  }
};

const changeRole = async (e: Event) => {
  e.preventDefault();
  const target = e.target as HTMLSelectElement;
  const url = target.getAttribute('data-action') as string;
  const role = target.value;
  const data = { role };

  try {
    const response = await fetchPUT(url, data);

    if (response.ok) {
      new Alert('Le rôle a été modifié avec succès 🚀', 'success', {
        containerId: 'editUserInfosAlert',
        duration: 5000,
        dismissible: true,
      });
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
        window.location.reload();
      }, 5000);
    } else {
      console.error('Erreur lors de la modification du rôle.');
      new Alert('Erreur lors de la modification du rôle.', 'danger', {
        containerId: 'user-permission-tab',
        dismissible: true,
      });
    }
  } catch (error) {
    console.error('Erreur lors de la modification du rôle : ', error);
  }
};

editForm.getForm().addEventListener('submit', (e) => handleEditFormSubmit(e));
