import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WifiIcon from '@mui/icons-material/Wifi';
import PoolIcon from '@mui/icons-material/Pool';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ElevatorIcon from '@mui/icons-material/Elevator';
import KitchenIcon from '@mui/icons-material/Kitchen';
import YardIcon from '@mui/icons-material/Yard';
import FireplaceIcon from '@mui/icons-material/Fireplace';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SecurityIcon from '@mui/icons-material/Security';
import LaundryServiceIcon from '@mui/icons-material/LocalLaundryService';
import TvIcon from '@mui/icons-material/Tv';
import BalconyIcon from '@mui/icons-material/BalconyOutlined';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import GarageIcon from '@mui/icons-material/Garage';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import BathtubIcon from '@mui/icons-material/Bathtub';
import BedIcon from '@mui/icons-material/Bed';
import ShowerIcon from '@mui/icons-material/Shower';
import ParkingIcon from '@mui/icons-material/LocalParking';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import DeckIcon from '@mui/icons-material/Deck';
import FenceIcon from '@mui/icons-material/Fence';
import AlarmIcon from '@mui/icons-material/Alarm';
import RoofingIcon from '@mui/icons-material/Roofing';
import SpaIcon from '@mui/icons-material/Spa';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import type { SvgIconComponent } from '@mui/icons-material';
import { Autocomplete, Box, Paper, TextField, Typography } from '@mui/material';
import type { AdFormValues, AttributeOption, UpdateFn } from './types';
import { sectionSx, sectionTitleSx } from './types';

const ATTRIBUTE_ICON_MAP: Record<string, SvgIconComponent> = {
  Wifi: WifiIcon,
  Pool: PoolIcon,
  LocalParking: ParkingIcon,
  AcUnit: AcUnitIcon,
  Elevator: ElevatorIcon,
  Kitchen: KitchenIcon,
  Yard: YardIcon,
  Fireplace: FireplaceIcon,
  FitnessCenter: FitnessCenterIcon,
  Security: SecurityIcon,
  LocalLaundryService: LaundryServiceIcon,
  Tv: TvIcon,
  Balcony: BalconyIcon,
  BalconyOutlined: BalconyIcon,
  WaterDrop: WaterDropIcon,
  ElectricBolt: ElectricBoltIcon,
  Garage: GarageIcon,
  DirectionsCar: DirectionsCarIcon,
  Bathtub: BathtubIcon,
  Bed: BedIcon,
  Shower: ShowerIcon,
  LocalBar: LocalBarIcon,
  LocalCafe: LocalCafeIcon,
  Deck: DeckIcon,
  Fence: FenceIcon,
  Alarm: AlarmIcon,
  Roofing: RoofingIcon,
  Spa: SpaIcon,
  SportsSoccer: SportsSoccerIcon,
  CheckCircle: CheckCircleIcon,
  Lightbulb: LightbulbIcon,
};

const getAttributeIcon = (iconName?: string): SvgIconComponent => {
  if (!iconName) return CheckCircleOutlineIcon;
  const cleaned = iconName.replace(/^heroicon-[o-s]-/, '');
  return (
    ATTRIBUTE_ICON_MAP[iconName] ??
    ATTRIBUTE_ICON_MAP[cleaned] ??
    CheckCircleOutlineIcon
  );
};

interface AdFormEquipmentProps {
  values: AdFormValues;
  update: UpdateFn;
  autocompleteOptions: AttributeOption[];
}

export default function AdFormEquipment({
  values,
  update,
  autocompleteOptions,
}: AdFormEquipmentProps) {
  if (autocompleteOptions.length === 0) return null;

  return (
    <Paper elevation={0} sx={sectionSx}>
      <Typography
        variant="subtitle1"
        sx={{
          ...sectionTitleSx,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        Équipements & Services
      </Typography>
      <Autocomplete
        multiple
        options={autocompleteOptions}
        groupBy={(option) => option.group}
        getOptionLabel={(option) => option.label}
        value={values.attributes
          .map((v) => autocompleteOptions.find((a) => a.value === v))
          .filter((a): a is AttributeOption => !!a)}
        onChange={(_, newValue) => {
          update(
            'attributes',
            newValue.map((opt) => opt.value)
          );
        }}
        isOptionEqualToValue={(opt, val) => opt.value === val.value}
        renderOption={(props, option) => {
          const IconC = getAttributeIcon(option.icon);
          return (
            <li {...props} key={option.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconC sx={{ fontSize: 20, color: 'text.secondary' }} />
                {option.label}
              </Box>
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Rechercher et sélectionner des équipements…"
            size="small"
            label="Équipements"
          />
        )}
        sx={{ maxWidth: 420 }}
        slotProps={{ paper: { sx: { maxHeight: 320 } } }}
      />
    </Paper>
  );
}
