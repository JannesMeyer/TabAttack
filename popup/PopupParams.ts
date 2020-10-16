type PopupParams = Required<Pick<NonNullable<Parameters<typeof browser.windows.create>[0]>, 'height' | 'width' | 'top' | 'left'>>;
export default PopupParams;
