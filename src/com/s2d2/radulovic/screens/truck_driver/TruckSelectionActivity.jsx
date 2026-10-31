import React from 'react';
import MachineSelectionScreen from '../../ui/components/MachineSelectionScreen.jsx';

export default function TruckSelectionActivity({ onSelected }) {
  return <MachineSelectionScreen kind="truck" onSelected={onSelected} />;
}
