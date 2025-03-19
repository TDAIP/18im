from setuptools import setup, find_packages

setup(
    name="VTriP-VAI.dis",
    version="0.3.0",
    description="Fork của discord-py-self với cú pháp rút gọn, tích hợp bản quyền VTriP Official và nhiều tiện ích nâng cao.",
    author="VTriP Official",
    author_email="contact@vtripofficial.com",
    url="https://github.com/VTriPOfficial/VTriP-VAI.dis",
    packages=find_packages(),
    install_requires=[
        "discord-py-self",  # Phiên bản tương thích
        "aiohttp",          # Gọi API bất đồng bộ
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.6',
)