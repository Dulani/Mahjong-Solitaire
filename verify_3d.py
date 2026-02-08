import asyncio
from playwright.async_api import async_playwright
import os

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1200, 'height': 800})

        path = os.path.abspath("index.html")
        await page.goto(f"file://{path}")
        await page.wait_for_selector(".tile")

        # Capture default 45deg tilt
        await page.screenshot(path="3d_tilt_45.png")
        print("Captured 3d_tilt_45.png")

        # Change rotation to see side
        await page.fill("#perspX", "70")
        await page.fill("#perspY", "30")
        # Trigger input event manually if needed, but playwright fill should do it
        await page.evaluate("updatePerspective()")
        await asyncio.sleep(0.5)
        await page.screenshot(path="3d_tilt_70_rot_30.png")
        print("Captured 3d_tilt_70_rot_30.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
