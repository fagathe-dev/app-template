#!/usr/bin/env python

import os
import sys
import subprocess

ROOT_DIR = os.path.dirname(os.path.abspath(__file__)) + '/'
JS_DIR = os.path.join(ROOT_DIR, 'public/js')
# Directory name you want to create
TS_FILES_TO_COMPILE = ['main.js', 'form.js', 'uploader.js']
JS_BUILD_DIR = os.path.join(ROOT_DIR, "public/js-mini")

def create_dir(dir_path):
    # Check if the directory exists
    if os.path.exists(dir_path) == False:
        # Create the directory
        os.makedirs(os.path.join(dir_path), exist_ok=True)
        print(f"Directory '{dir_path}' created successfully!")
    
def run_command(command):
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        if (result.stdout):
            print(f'Output:\n{result.stdout}')
    except subprocess.CalledProcessError as e:
        print(f'Command \'{command}\' failed 🛑 with error: \n{e.stderr}')

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