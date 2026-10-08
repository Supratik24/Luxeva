from PIL import Image

def get_dominant_colors(image_path):
    img = Image.open(image_path)
    img = img.convert('RGB')
    
    # Get colors
    # We will sample specific regions to get the background and the button color
    width, height = img.size
    
    # Background (top left corner)
    bg_color = img.getpixel((10, 10))
    
    # Button (center of the image roughly)
    # Let's just find the most common color (background) and the darkest/lightest color
    colors = img.getcolors(width * height)
    colors.sort(key=lambda x: x[0], reverse=True)
    
    return [
        '#{:02x}{:02x}{:02x}'.format(c[1][0], c[1][1], c[1][2])
        for c in colors[:5]
    ]

print("Light mode:", get_dominant_colors(r"C:/Users/supra/.gemini/antigravity/brain/2eb2996a-a08e-444a-84ad-0626bf097f9c/.user_uploaded/media_1791480786251_fd944869.png"))
print("Dark mode:", get_dominant_colors(r"C:/Users/supra/.gemini/antigravity/brain/2eb2996a-a08e-444a-84ad-0626bf097f9c/.user_uploaded/media_1791480822721_90eb0737.png"))
