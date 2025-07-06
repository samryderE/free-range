import { openSettings } from "expo-linking";
import { Accelerometer } from "expo-sensors";
import { Subscription, isAvailableAsync, requestPermissionsAsync } from "expo-sensors/build/Pedometer";
import { useEffect, useState } from "react";

type Poll = number | null;
type IsShakeProps = { x: number };
type AccelerometerStatus = "uninitialized" | "available" | "not_available";

export function useIsShake() {
  const [accelerometerStatus, setAccelerometerStatus] = useState<AccelerometerStatus>("uninitialized");
  const [isAccelerometerStatusPending, setIsAccelerometerStatusPending] = useState(false);
  const [isShakeReady, setIsShakeReady] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [_, setData] = useState<IsShakeProps>();
  const [isShakeTriggered, setIsShakeTriggered] = useState(false);

  let polls: Poll[] = [null, null];
  let diffs = [];

  function isShake({ x: newX }: IsShakeProps) {
    if (diffs.length === 2) {
      setIsShakeTriggered(true);
      setIsShakeReady(false);

      polls = [null, null];
      diffs = [];

      setIsShakeTriggered(false);
    }

    if (newX < 0) polls[0] = newX;
    if (newX >= 0) polls[1] = newX;

    let change;
    if (polls[0] && (polls[1] || polls[1] === 0)) {
      change = Math.abs(polls[1] - polls[0]);
    }
    if (change && change > 1.5) {
      diffs.push(change);
      polls = [null, null];
    }

    setData({ x: newX });
  }

  Accelerometer.setUpdateInterval(75);

  const _subscribe = () => {
    setSubscription(Accelerometer.addListener(isShake));
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  const checkAccelerometerAvailablity = async () => {
    try {
      const availability = await isAvailableAsync();
      setAccelerometerStatus(() => {
        setIsAccelerometerStatusPending(false);
        return availability ? "available" : "not_available";
      });
    } catch (err) {
      // TODO: send this error to a log service | popup alert or tray
      console.log(err);
      setIsAccelerometerStatusPending(false);
    }
  };

  const getAccelerometerPermission = async () => {
    try {
      const permissionResponse = await requestPermissionsAsync();
      if (permissionResponse.granted) {
        setAccelerometerStatus(() => {
          setIsAccelerometerStatusPending(false);
          return "available";
        });
        // following else if block for when permissionResponse.canAskAgain === false in order to direct end user to Settings app in order to enable permission to access Accelerometer
      } else if (!permissionResponse.canAskAgain) openSettings();
    } catch (err) {
      // TODO: send this error to a log service | popup alert or tray
      console.log(err);
      setIsAccelerometerStatusPending(false);
    }
  };

  useEffect(() => {
    if (accelerometerStatus === "uninitialized" && !isAccelerometerStatusPending) {
      setIsAccelerometerStatusPending(true);
      checkAccelerometerAvailablity();
    }
    if (accelerometerStatus === "not_available" && !isAccelerometerStatusPending) {
      setIsAccelerometerStatusPending(true);
      getAccelerometerPermission();
    }
    // invocation of _subscribe when accelerometer is available and isShakeReady === true
    if (accelerometerStatus === "available" && isShakeReady) {
      _subscribe();
      // isShake Accelerometer listener is removed when !isShakeReady
    } else if (accelerometerStatus === "available" && !isShakeReady) _unsubscribe();
    return () => _unsubscribe();
  }, [isShakeReady, accelerometerStatus]);

  return { isShakeTriggered, setIsShakeReady };
}
