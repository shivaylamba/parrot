/*
 * Copyright 2019 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import { renderHook, act } from '@testing-library/react-hooks';

import useScenarios from '../../../src/app/hooks/useScenarios';

describe('useScenarios', () => {
  const url = 'squawk';
  const scenarioName = 'my-scenario';
  const scenarios = [
    {
      name: scenarioName,
    },
  ];
  const jsonScenario = jest.fn(() => Promise.resolve(scenarioName));
  const jsonScenarios = jest.fn(() => Promise.resolve(scenarios));

  beforeAll(() => {
    global.fetch = jest.fn(fetchUrl =>
      Promise.resolve({
        json: fetchUrl.endsWith('scenarios') ? jsonScenarios : jsonScenario,
      })
    );
    delete global.chrome;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return scenarios api and preload scenarios', async () => {
    expect.assertions(2);

    const { result, waitForNextUpdate } = renderHook(() => useScenarios(url));

    expect(result.current).toMatchObject({
      loading: expect.any(Boolean),
      scenario: expect.any(String),
      scenarios: expect.any(Array),
      setScenario: expect.any(Function),
      loadScenarios: expect.any(Function),
    });

    await waitForNextUpdate();

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should set initialScenario and load scenarios from parrot-server', async () => {
    expect.assertions(5);

    const { result, waitForNextUpdate } = renderHook(() => useScenarios(url, scenarioName));

    await waitForNextUpdate();

    expect(result.current.scenario).toEqual(scenarioName);
    expect(result.current.scenarios).toEqual(scenarios);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenCalledWith(`${url}/parrot/scenario`);
    expect(global.fetch).toHaveBeenCalledWith(`${url}/parrot/scenarios`);
  });

  it('should set current scenario and make fetch request to parrot-server', async () => {
    expect.assertions(3);

    const { result, waitForNextUpdate } = renderHook(() => useScenarios(url));

    await waitForNextUpdate();

    act(() => {
      result.current.setScenario(scenarioName);
    });

    await waitForNextUpdate();

    expect(result.current.scenario).toEqual(scenarioName);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch).toHaveBeenCalledWith(`${url}/parrot/scenario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scenario: scenarioName }),
    });
  });

  it('should load scenarios from parrot-server', async () => {
    expect.assertions(5);

    const { result, waitForNextUpdate } = renderHook(() => useScenarios(url));

    await waitForNextUpdate();

    act(() => {
      result.current.loadScenarios();
    });

    await waitForNextUpdate();

    expect(result.current.scenario).toEqual(scenarioName);
    expect(result.current.scenarios).toEqual(scenarios);
    expect(global.fetch).toHaveBeenCalledTimes(4);
    expect(global.fetch).toHaveBeenCalledWith(`${url}/parrot/scenario`);
    expect(global.fetch).toHaveBeenCalledWith(`${url}/parrot/scenarios`);
  });

  it('should do nothing on failure when calling setScenario or loadScenario', async () => {
    expect.assertions(2);

    const throwFailure = () => {
      throw new Error('failure');
    };

    global.fetch.mockImplementationOnce(throwFailure).mockImplementationOnce(throwFailure);

    const { result } = renderHook(() => useScenarios(url));

    act(() => {
      result.current.setScenario(scenarioName);
    });

    expect(result.current.scenario).not.toEqual(scenarioName);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  describe('with chrome', () => {
    const reload = jest.fn();

    beforeEach(() => {
      global.chrome = {
        devtools: {
          inspectedWindow: {
            reload,
          },
        },
      };
    });

    afterEach(() => {
      delete global.chrome;
    });

    it('should reload window when setScenario is called', async () => {
      expect.assertions(1);

      const { result, waitForNextUpdate } = renderHook(() => useScenarios(url));

      await waitForNextUpdate();

      act(() => {
        result.current.setScenario(scenarioName);
      });

      await waitForNextUpdate();

      expect(reload).toHaveBeenCalledWith(null);
    });
  });
});
