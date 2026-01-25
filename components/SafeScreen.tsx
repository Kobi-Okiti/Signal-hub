import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ReactNode } from 'react'
import { colors } from '@/constants/theme'

interface Props {
  children: ReactNode
}

const SafeScreen = ({ children }: Props) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={{paddingTop: insets.top, flex: 1, backgroundColor: colors.background}}>
            {children}
        </View>
    )
}

export default SafeScreen