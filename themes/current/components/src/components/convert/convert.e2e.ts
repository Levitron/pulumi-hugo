import { newE2EPage } from '@stencil/core/testing';

describe('pulumi-convert', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<pulumi-convert></pulumi-convert>');

    const element = await page.find('pulumi-convert');
    expect(element).toHaveClass('hydrated');
  });
});
