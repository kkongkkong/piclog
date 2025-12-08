from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from rembg import remove
from PIL import Image
import io
import requests
import base64
import os

app = Flask(__name__)
CORS(app)  # Next.js에서 접근 허용

@app.route('/health', methods=['GET'])
def health_check():
    """서버 상태 확인"""
    return jsonify({'status': 'ok', 'message': 'Background removal server is running'})

@app.route('/remove-bg', methods=['POST'])
def remove_background():
    """배경 제거 API"""
    try:
        data = request.get_json()
        image_url = data.get('image_url')

        if not image_url:
            return jsonify({'success': False, 'message': 'No image_url provided'}), 400

        print(f'Processing image: {image_url}')

        # 이미지 다운로드
        response = requests.get(image_url)
        if response.status_code != 200:
            return jsonify({'success': False, 'message': 'Failed to download image'}), 400

        # 이미지 열기
        input_image = Image.open(io.BytesIO(response.content))

        # 배경 제거
        output_image = remove(input_image)

        # PNG로 변환 (투명 배경 지원)
        output_buffer = io.BytesIO()
        output_image.save(output_buffer, format='PNG')
        output_buffer.seek(0)

        # Base64로 인코딩하여 반환
        base64_image = base64.b64encode(output_buffer.getvalue()).decode('utf-8')

        return jsonify({
            'success': True,
            'message': 'Background removed successfully',
            'image_base64': f'data:image/png;base64,{base64_image}'
        })

    except Exception as e:
        print(f'Error: {str(e)}')
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

@app.route('/remove-bg-file', methods=['POST'])
def remove_background_file():
    """배경 제거 (파일 업로드 방식)"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file uploaded'}), 400

        file = request.files['file']

        # 이미지 열기
        input_image = Image.open(file.stream)

        # 배경 제거
        output_image = remove(input_image)

        # PNG로 변환
        output_buffer = io.BytesIO()
        output_image.save(output_buffer, format='PNG')
        output_buffer.seek(0)

        return send_file(
            output_buffer,
            mimetype='image/png',
            as_attachment=True,
            download_name='removed_bg.png'
        )

    except Exception as e:
        print(f'Error: {str(e)}')
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500

if __name__ == '__main__':
    print('Background Removal Server Starting...')
    print('Server running at: http://localhost:5000')
    print('Health check: http://localhost:5000/health')
    print('Remove BG endpoint: http://localhost:5000/remove-bg')
    app.run(host='0.0.0.0', port=5000, debug=True)
