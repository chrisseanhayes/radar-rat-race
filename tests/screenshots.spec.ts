import { test, expect } from '@playwright/test';

test('take screenshots of gameplay and debug menu', async ({ page }) => {
  // Navigate to the local app
  await page.goto('/');

  // Wait for the app to render, we can wait for a specific element or just use a timeout
  await page.waitForTimeout(2000); // 2 seconds to let the canvas render and any intro finish

  // The game starts when any key is pressed, let's press Space to start
  await page.keyboard.press('Space');
  await page.waitForTimeout(1000); // Wait for the game to start and the rat to move a bit

  // Take a screenshot of the active gameplay state
  await page.screenshot({ path: 'screenshots/gameplay.png', fullPage: true });

  // Now let's capture the Music Editor
  // It is toggled by clicking a button with text "Music Editor"
  await page.click('text="Music Editor"');
  await page.waitForTimeout(500); // wait for modal animation/render

  // Take a screenshot of the music editor open at the top
  await page.screenshot({ path: 'screenshots/music-editor-top.png', fullPage: true });

  // Scroll down the piano roll container to see the lower notes
  await page.evaluate(() => {
    const container = document.querySelector('.piano-roll-container');
    if (container) {
      container.scrollTop = 400; // Adjust if you want to scroll more or less
    }
  });
  await page.waitForTimeout(200); // wait a moment for the scroll to render

  // Take a screenshot of the music editor open (scrolled)
  await page.screenshot({ path: 'screenshots/music-editor-scrolled.png', fullPage: true });

  // Note: if your dev tools have separate tabs (like MusicEditor, MapEditor, etc.)
  // you can interact with them using page.click() and take individual screenshots:
  // await page.click('text=Music');
  // await page.screenshot({ path: 'screenshots/music-editor.png' });
});
