#!/usr/bin/env python

import os
import sys
import subprocess

ROOT_DIR = os.path.dirname(os.path.abspath(__file__)) + '/'
JS_DIR = os.path.join(ROOT_DIR, 'public/js')
SCSS_DIR = os.path.join(ROOT_DIR, 'public/scss')
CSS_DIR = os.path.join(ROOT_DIR, 'public/css')
# Directory name you want to create
TS_FILES_TO_COMPILE = ['main.js', 'form.js', 'uploader.js']
SCSS_FILES_TO_COMPILE = ['style.scss']
JS_BUILD_DIR = os.path.join(ROOT_DIR, 'public/js-mini')
CSS_BUILD_DIR = os.path.join(ROOT_DIR, 'public/css-mini')

def create_dir(dir_path):
    # Check if the directory exists
    if os.path.exists(dir_path) == False:
        # Create the directory
        os.makedirs(os.path.join(dir_path), exist_ok=True)
        print(f'Directory \'{dir_path}\' created successfully!')
    
def run_command(command):
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        if (result.stdout):
            print(f'Output:\n{result.stdout}')
    except subprocess.CalledProcessError as e:
        print(f'Command \'{command}\' failed 🛑 with error: \n{e.stderr}')
        
def build_css():
    for file in os.listdir(SCSS_DIR):
        if file.endswith('.scss') and file in SCSS_FILES_TO_COMPILE:
            create_dir(CSS_DIR)
            create_dir(CSS_BUILD_DIR)
            print(f'Compiling \'{file}\' file')
            file_path = os.path.join(SCSS_DIR, file)
            file_name = os.path.splitext(file)[0]
            output_path = os.path.join(CSS_BUILD_DIR, f'{file_name}.min.css')
            output_css_path = os.path.join(CSS_DIR, f'{file_name}.css')
            run_command(f'sass {file_path} --no-source-map {output_css_path}')
            run_command(f'sass {file_path} --no-source-map --style=compressed {output_path}')

def build_js():
    print('Compiling TS file ...')
    run_command('npm run tsc:compile')
    print('Build JS file ...')
    for file in os.listdir(JS_DIR):
        if file.endswith('.js') and file in TS_FILES_TO_COMPILE:
            create_dir(JS_BUILD_DIR)
            file_path = os.path.join(JS_DIR, file)
            file_name = os.path.splitext(file)[0]
            output_path = os.path.join(JS_BUILD_DIR, f'{file_name}.min.js')
            run_command(f'terser -c -m -o {output_path} -- {file_path}')

build_js()
build_css()