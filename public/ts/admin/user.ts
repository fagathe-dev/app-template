import { Alert } from '../components/Alert';
import { ApiError, fetchAPI } from '../utils/fetch';
import { FormManager } from '../utils/form';

const editForm = new FormManager({
  form: document.getElementById('editUserInfosForm') as HTMLFormElement,
});

const handleEditFormSubmit = async (e: SubmitEvent) => {
  e.preventDefault();
  const data = editForm.getData();
  const actionUrl = editForm.form.getAttribute('action') as string;

  try {
    const response = await fetchAPI(actionUrl, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

editForm.form.addEventListener('submit', (e) => handleEditFormSubmit(e));
