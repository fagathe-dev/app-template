import { get } from 'http';

type FileEntry = {
  files: string | Record<string, any>;
  dates: Array<string>;
};

const DATA_FILES_STORAGE_KEY = 'ffr__logfile' as const;

const getURLParams = (): Record<string, string> => {
  const params: Record<string, string> = Object.fromEntries(new URL(window.location.href).searchParams.entries());

  return params || {};
}
class UIGrid {
  dates: Array<string>;
  urlParams: Array<URLParam>;
  constructor(dates?: Array<string>) {
    this.init();
    this.dates = dates || [];
    // @ts-ignore
    this.urlParams = getURLParams();
  }

  setUpSelection() {
    console.log('Selection set');
  }

  init() {
    this.setUpSelection();
    console.log(this.urlParams);
  }
}

const getData = async (): Promise<FileEntry> => {
  let data;

  if (localStorage.getItem(DATA_FILES_STORAGE_KEY)) {
    data = JSON.parse(localStorage.getItem(DATA_FILES_STORAGE_KEY) || '{}') as FileEntry;
  } else {
    // @ts-ignore
    data = (await fetchJSON(API_LOG_FILES_GET, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })) as Promise<FileEntry>;

    // localStorage.setItem(DATA_FILES_STORAGE_KEY, JSON.stringify(data));
    console.log('Data fetched from API and stored in localStorage');
  }

  return data;
};

const displayFiles = async () => {
  const { files, dates } = await getData();
  const front = new UIGrid();
  console.log({ dates });

  for (const key in files as Record<string, any>) {
    if (Object.prototype.hasOwnProperty.call(files, key)) {
      const element = files[key];

      if (Array.isArray(element)) {
        for (let i = 0; i < element.length; i++) {
          console.log(`Array[${i}] :`, element[i]);
        }
      } else {
        console.log('Object :', element);
      }
    }
  }
};

displayFiles();

const setUpDate = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const url = new URL(window.location.href);
  const urlParams = url.searchParams;
  urlParams.set('logDay', target.value);
  window.history.pushState({}, '', url);
  // displayFiles();
};
