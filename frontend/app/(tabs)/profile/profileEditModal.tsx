import UserInput from '@/components/UserInput';
import { UserContext } from '@/contexts/UserContext';
import { UserState } from '@/types/user';
import { isClerkAPIResponseError, useUser } from '@clerk/clerk-expo';
import axios from 'axios';
import { MediaTypeOptions, launchImageLibraryAsync } from 'expo-image-picker';
import { Stack } from 'expo-router';
import { useContext } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import { Avatar, Button, Form, Separator, View, XStack, YStack } from 'tamagui';

const ProfileEditModal = () => {
  const { user } = useUser();
  const {
    handleSubmit,
    control,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<UserState>({
    defaultValues: {
      username: user?.username,
      firstName: user?.firstName,
      lastName: user?.lastName,
      password: user?.passwordEnabled ? 'password' : '',
    },
  });
  const { token, user_data, user_id: userId } = useContext(UserContext);

  const updateUserData: SubmitHandler<UserState> = async (data) => {
    try {
      const isDirtyClerk =
        dirtyFields.firstName || dirtyFields.lastName || dirtyFields.username;
      const isNotDirtyClerk = dirtyFields.bio;
      if (isDirtyClerk) {
        await user?.update({
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
        });
      }
      if (isNotDirtyClerk) {
        // create userData to pass to backend
        const userData = {
          ...user_data,
          bio: data.bio,
          username: data.username,
        };

        await axios
          .patch(
            `${process.env.EXPO_PUBLIC_IP_ADDR}/api/users/${userId}`, // API route
            userData, // userData to update
            { headers: { Authorization: `Bearer: ${token}` } }, // auth header
          )
          .then(() => user?.update({ username: data.username })) // update user username
          .catch((error) => console.log('error:', error.message)); // console log any errors
      }
      if (isDirty) {
        Toast.show({ text1: 'Profile Updated', type: 'success' });
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        Toast.show({ text1: err.message, type: 'error' });
      }
    }
  };

  const handleUserProfileChange = async () => {
    let pfp = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      base64: true,
    });

    if (!pfp.canceled) {
      const base64 = `data:image/png;base64,${pfp.assets[0].base64}`;
      try {
        user?.setProfileImage({ file: base64 });
        Toast.show({ text1: 'Profile Image Updated', type: 'success' });
      } catch (err) {
        if (isClerkAPIResponseError(err)) {
          Toast.show({ text1: err.message, type: 'error' });
          console.error(err.errors);
        }

        Toast.show({
          type: 'error',
          text1: 'Profile Picture Update Failed!',
          position: 'bottom',
          visibilityTime: 1000,
        });
      }
    }
  };

  return (
    <View>
      <Stack.Screen options={{ headerTitle: 'Edit Profile' }} />
      <YStack gap={'$1'} px={'$2'}>
        <TouchableOpacity onPress={handleUserProfileChange}>
          <Avatar circular margin={'auto'} size={'$5'} my={'$4'}>
            <Avatar.Image src={user.imageUrl ?? ' '} />
          </Avatar>
        </TouchableOpacity>
        <Separator />
        <Form onSubmit={handleSubmit(updateUserData)}>
          <Controller
            name={'username'}
            control={control}
            render={({ field }) => (
              <XStack>
                <UserInput
                  field={field}
                  useLabel
                  labelID='Username'
                  placeholder={user?.username ?? 'username'}
                />
              </XStack>
            )}
          />
          <Separator />
          <Controller
            name={'firstName'}
            control={control}
            render={({ field }) => (
              <XStack>
                <UserInput
                  field={field}
                  useLabel
                  labelID='First Name'
                  placeholder={user.firstName}
                />
              </XStack>
            )}
          />
          <Separator />
          <Controller
            name={'lastName'}
            control={control}
            render={({ field }) => (
              <XStack>
                <UserInput
                  field={field}
                  useLabel
                  labelID='Last Name'
                  placeholder={user.lastName}
                />
              </XStack>
            )}
          />
          <Separator />
          <Controller
            name={'bio'}
            control={control}
            render={({ field }) => (
              <XStack>
                <UserInput
                  field={field}
                  useLabel
                  labelID='Bio'
                  placeholder={user_data.bio}
                />
              </XStack>
            )}
          />
          <Form.Trigger asChild>
            <Button backgroundColor={'$red10'}>Update</Button>
          </Form.Trigger>
        </Form>
      </YStack>
    </View>
  );
};

export default ProfileEditModal;
