import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import FirstSessionNextScreen from '../FirstSessionNextScreen';

describe('FirstSessionNextScreen', () => {
  it('Türkçe metinleri render eder', () => {
    const { getByText } = render(
      <FirstSessionNextScreen
        onContinueStage={jest.fn()}
        onStartMission={jest.fn()}
      />,
    );

    expect(getByText('Harika başlangıç 🎉')).toBeTruthy();
    expect(getByText('Sahneye Devam Et')).toBeTruthy();
    expect(getByText('Bugünün Görevi')).toBeTruthy();
  });

  it('aksiyonlara basınca callback çağırır', () => {
    const onContinueStage = jest.fn();
    const onStartMission = jest.fn();

    const { getByA11yLabel } = render(
      <FirstSessionNextScreen
        onContinueStage={onContinueStage}
        onStartMission={onStartMission}
      />,
    );

    fireEvent.press(getByA11yLabel('Sahneye devam et'));
    fireEvent.press(getByA11yLabel('Bugünün görevini başlat'));

    expect(onContinueStage).toHaveBeenCalledTimes(1);
    expect(onStartMission).toHaveBeenCalledTimes(1);
  });

  it('iki aksiyon da kapalıysa boş durum mesajını gösterir', () => {
    const { getByText } = render(
      <FirstSessionNextScreen
        onContinueStage={jest.fn()}
        onStartMission={jest.fn()}
        stageEnabled={false}
        missionEnabled={false}
      />,
    );

    expect(getByText('Yeni içerik hazırlanıyor')).toBeTruthy();
  });

  it('hata olursa fallback mesajı gösterir', async () => {
    const onContinueStage = jest.fn(async () => {
      throw new Error('failed');
    });

    const { getByA11yLabel, getByText } = render(
      <FirstSessionNextScreen
        onContinueStage={onContinueStage}
        onStartMission={jest.fn()}
      />,
    );

    fireEvent.press(getByA11yLabel('Sahneye devam et'));

    await waitFor(() => {
      expect(getByText('Bir sorun oluştu. Lütfen tekrar dene.')).toBeTruthy();
    });
  });

  it('loading sırasında çift tıklamayı engeller', () => {
    let resolvePromise: (() => void) | undefined;

    const onContinueStage = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        }),
    );

    const { getByA11yLabel } = render(
      <FirstSessionNextScreen
        onContinueStage={onContinueStage}
        onStartMission={jest.fn()}
      />,
    );

    const button = getByA11yLabel('Sahneye devam et');

    fireEvent.press(button);
    fireEvent.press(button);

    expect(onContinueStage).toHaveBeenCalledTimes(1);

    resolvePromise?.();
  });
});
