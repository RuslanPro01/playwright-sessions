import { Browser, chromium } from '@playwright/test';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { faker } from '@faker-js/faker';


const argv = await yargs(hideBin(process.argv))
  .option('sessions', {
    alias: 's',
    type: 'number',
    description: 'Количество устройств (сессий)',
    default: 4,
  })
  .option('mobile', {
    alias: 'm',
    type: 'boolean',
    description: 'Создать мобильный вид',
    default: true,
  })
  .option('url', {
    alias: 'u',
    type: 'string',
    description: 'URL для открытия',
    default: 'http://localhost:5173/admin/projects',
  })
  .option('width', {
    alias: 'w',
    type: 'number',
    description: 'Ширина окна',
    default: 500,
  })
  .option('height', {
    alias: 'h',
    type: 'number',
    description: 'Высота окна',
    default: 912,
  })
  .option('no-cache', {
    alias: 'c',
    type: 'boolean',
    description: 'Отключить кеширование браузера',
    default: false,
  })
  .help()
  .argv;

const numberOfSessions = argv.sessions;
const url = argv.url;
const width = argv.width;
const height = argv.height;
const isMobile = argv.mobile;

let browsers: Browser[] = [];

async function launchBrowsers() {
  if (browsers.length > 0) {
    for (const browser of browsers) {
      await browser.close();
    }
    browsers = [];
  }

  for (let i = 0; i < numberOfSessions; i++) {
    const xOffset = i * width;
    const yOffset = 0;

    const browser = await chromium.launch({
      headless: false,
      args: [
        `--window-position=${xOffset},${yOffset}`,
      ],
    });

    const contextOptions = {
      viewport: { width, height },
      isMobile: isMobile,
      acceptDownloads: true,
      bypassCSP: true,
    };

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    await page.goto(url);

    if (page.url().includes('/mobile/')) {
      await page.waitForLoadState('domcontentloaded');
      await page.getByPlaceholder("Имя").fill(faker.person.firstName() + faker.number.int({ max: 999999999 }));
      await page.getByRole("button", { name: "Далее" }).click();
    }

    browsers.push(browser);
  }
}

(async () => {
  await launchBrowsers();
  console.log('Нажмите "r" + Enter для перезапуска браузеров');
  console.log('Нажмите "q" + Enter для закрытия браузеров');

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (data: string) => {
    data = data.trim().toLowerCase();
    if (data === 'r' || data === 'к') {
      console.log('Перезапуск браузеров...');
      await launchBrowsers();
    }
    if (data === 'q' || data === 'й') {
      console.log('Закрытие браузеров...');
      for (const browser of browsers) {
        await browser.close();
      }
      process.exit();
    }
  });

  process.stdin.resume();
})();
