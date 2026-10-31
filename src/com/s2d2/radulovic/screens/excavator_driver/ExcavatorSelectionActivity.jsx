import React from 'react';
import MachineSelectionScreen from '../../ui/components/MachineSelectionScreen.jsx';

export default function ExcavatorSelectionActivity({ onSelected }) {
  return <MachineSelectionScreen kind="excavator" onSelected={onSelected} />;
}
