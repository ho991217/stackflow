import {
  produceEffects,
  StackflowPluginHook,
  StackflowPluginPostEffectHook,
} from "@stackflow/core";
import React, { useCallback, useEffect, useRef } from "react";

import { useCore } from "./core";
import { usePlugins } from "./plugins";

const EffectManager: React.FC = () => {
  const core = useCore();
  const plugins = usePlugins();

  const onInit = useCallback<StackflowPluginHook>((actions) => {
    plugins.forEach((plugin) => {
      plugin.onInit?.(actions);
    });
  }, []);

  const triggerEffect = useCallback<StackflowPluginPostEffectHook<any>>(
    ({ actions, effect }) => {
      switch (effect._TAG) {
        case "PUSHED": {
          plugins.forEach((plugin) => plugin.onPushed?.({ actions, effect }));
          break;
        }
        case "POPPED": {
          plugins.forEach((plugin) => plugin.onPopped?.({ actions, effect }));
          break;
        }
        case "REPLACED": {
          plugins.forEach((plugin) => plugin.onReplaced?.({ actions, effect }));
          break;
        }
        case "%SOMETHING_CHANGED%": {
          plugins.forEach((plugin) => plugin.onChanged?.({ actions, effect }));
          break;
        }
        default: {
          break;
        }
      }
    },
    [],
  );

  useEffect(() => {
    onInit?.({
      actions: {
        dispatchEvent: core.dispatchEvent,
        getState: core.getState,
      },
    });
  }, []);

  const prevStateRef = useRef(core.state);

  useEffect(() => {
    const prevState = prevStateRef.current;
    const effects = prevState ? produceEffects(prevState, core.state) : [];

    effects.forEach((effect) => {
      triggerEffect({
        actions: {
          dispatchEvent: core.dispatchEvent,
          getState: core.getState,
        },
        effect,
      });
    });

    prevStateRef.current = { ...core.state };
  }, [core]);

  return null;
};

export default EffectManager;
