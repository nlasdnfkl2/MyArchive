const launchBiosStageNow = () => {
    if (seqId !== bootState.bootSeqId) return;
    setBootStage('bios');
    if (typeof window.runBiosPostSequenceOnly === 'function') {
      window.runBiosPostSequenceOnly(seqId, bootState, setBootStage);
    }
  };

  const skip3d = Boolean(options.skip3d);
  if (!skip3d && typeof window.play3dCrtMonitorAnimation === 'function') {
    await window.play3dCrtMonitorAnimation({ alreadyClicked: Boolean(options.alreadyClicked) });
    if (seqId !== bootState.bootSeqId) return;
  }

  if (typeof window.__runBeforeBiosAfterAnimation === 'function') {
    window.__runBeforeBiosAfterAnimation(launchBiosStageNow);
    return;
  }

  launchBiosStageNow();
